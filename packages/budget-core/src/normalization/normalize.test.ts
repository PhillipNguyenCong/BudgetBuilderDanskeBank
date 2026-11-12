import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseMoney, normalizeDataset } from './index.js';
const account = {
  id: 'account-a',
  name: 'Demo account',
  currency: 'DKK',
  accountNumber: '12345678',
};
test('exact Danish amounts, zero and missing are distinct', () => {
  assert.equal(parseMoney('18.420,55'), 1842055);
  assert.equal(parseMoney('-299,00'), -29900);
  assert.equal(parseMoney(0), 0);
  assert.equal(parseMoney(null), null);
  assert.equal(parseMoney(''), null);
  assert.equal(parseMoney('1.234'), null);
  assert.equal(parseMoney('abc'), null);
  assert.equal(parseMoney('0.001'), null);
});
test('normalization retains uncertainty, source ID collisions and exact duplicate counts', () => {
  const first = {
    id: 'same',
    bookedOn: '20260801',
    direction: 'credit',
    amount: { value: -12.5, currency: 'DKK' },
    status: 'BOOKED ',
  };
  const out = normalizeDataset(
    {
      account,
      transactions: { items: [first, first, { ...first, amount: null }] },
      payments: { items: [] },
    },
    'demo-user',
    new Date('2026-09-03T12:00:00Z'),
  );
  assert.equal(out.transactions.length, 2);
  assert.equal(out.quality.duplicatesRemoved, 1);
  assert.equal(out.transactions[0]?.amountOere, 1250);
  assert.equal(out.transactions[0]?.direction, 'CREDIT');
  assert.equal(out.transactions[1]?.amountOere, null);
  assert.notEqual(out.transactions[0]?.id, out.transactions[1]?.id);
  assert.ok(out.transactions.every((t) => t.issues.some((i) => i.code === 'SOURCE_ID_COLLISION')));
  assert.equal(out.account.maskedIdentifier, '••••5678');
  assert.ok(!JSON.stringify(out).includes('12345678'));
});

test('FX conversion, original amounts, cancelled payments and unknown direction stay explicit', () => {
  const out = normalizeDataset(
    {
      account,
      transactions: {
        items: [
          {
            id: 'fx',
            bookedOn: '01/09/2026',
            direction: 'debit',
            amount: { value: '12,99', currency: 'EUR' },
            fxRate: '7,46',
            status: 'booked',
          },
          {
            id: 'unknown',
            bookedOn: '2026-09-10',
            amount: { value: 20, currency: 'EUR' },
            status: 'mystery',
          },
          {
            id: 'original',
            bookedOn: '2026-09-01',
            direction: 'debit',
            amount: { value: 100, currency: 'DKK' },
            originalAmount: { value: 13, currency: 'EUR' },
            status: 'BOOKED',
          },
          {
            id: 'released',
            bookedOn: '2026-09-02',
            direction: 'debit',
            amount: { value: 100, currency: 'DKK' },
            status: 'RELEASED',
          },
        ],
      },
      payments: {
        items: [
          {
            paymentId: 'p',
            amount: 500,
            amountCurrency: 'DKK',
            transactionDate: '2026/09/12',
            statusShortId: 'CAN',
            statusMessage: 'Cancelled',
            isRecurring: 'N',
          },
        ],
      },
    },
    'demo-user',
    new Date('2026-09-03T12:00:00Z'),
  );
  assert.equal(out.transactions[0]!.amountOere, 9691);
  assert.equal(out.transactions[0]!.conversionBasis, 'FX_RATE');
  assert.equal(out.transactions[1]!.amountOere, null);
  assert.equal(out.transactions[1]!.direction, 'UNKNOWN');
  assert.ok(out.transactions[1]!.issues.some((i) => i.code === 'FUTURE_DATE'));
  assert.deepEqual(out.transactions[2]!.original, { amount: '13', currency: 'EUR' });
  assert.equal(out.transactions[3]!.status, 'CANCELLED');
  assert.equal(out.payments[0]!.status, 'CANCELLED');
  assert.equal(out.payments[0]!.direction, 'UNKNOWN');
  assert.equal(out.payments[0]!.recurring, false);
});
test('invalid calendar dates, safe fallbacks and timezone boundaries', () => {
  const base = { direction: 'debit', amount: { value: 10, currency: 'DKK' }, status: 'BOOK' };
  const out = normalizeDataset(
    {
      account,
      transactions: {
        items: [
          { ...base, id: 'bad', bookedOn: '2026-02-30', valueDate: '20260805' },
          { ...base, id: 'time', bookedOn: '2026-08-31T23:30:00Z' },
          { ...base, id: 'missing', bookedOn: 'invalid' },
        ],
      },
    },
    'demo-user',
    new Date('2026-09-03T12:00:00Z'),
  );
  assert.equal(out.transactions[0]!.date, '2026-08-05');
  assert.equal(out.transactions[0]!.dateBasis, 'VALUE_DATE');
  assert.equal(out.transactions[1]!.date, '2026-09-01');
  assert.equal(out.transactions[2]!.date, null);
});
test('reordering source records does not change generated IDs', () => {
  const first = { id: 'a', amount: 1 },
    second = { id: 'a', amount: 2 };
  const norm = (items: unknown[]) =>
    normalizeDataset(
      { account, transactions: { items } },
      'demo-user',
      new Date('2026-09-03T12:00:00Z'),
    )
      .transactions.map((t) => t.id)
      .sort();
  assert.deepEqual(norm([first, second]), norm([second, first]));
});
