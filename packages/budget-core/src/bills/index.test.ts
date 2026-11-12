import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Transaction } from '@budget-builder/contracts';
import { discoverBills, billMerchantKeys, billMatchScore } from './index.js';
const tx = (id: string, date: string, text: string, amountOere = 9900): Transaction => ({
  id,
  sourceId: id,
  accountId: 'account',
  date,
  dateBasis: 'BOOKED_ON',
  direction: 'DEBIT',
  status: 'BOOKED',
  amountOere,
  original: { amount: null, currency: 'DKK' },
  conversionBasis: 'DKK_AMOUNT',
  text,
  counterparty: null,
  issues: [],
});
const discover = (transactions: Transaction[]) =>
  discoverBills({
    transactions,
    payments: [],
    accountId: 'account',
    date: '2026-09-03',
    coverage: { from: '2026-07-01', to: '2026-09-03', completeMonths: 2 },
  });
test('US-04: recurrent Rent and Netflix produce exact editable evidence-backed suggestions', () => {
  const result = discover([
    tx('rent1', '2026-07-01', 'Husleje', 800000),
    tx('rent2', '2026-08-01', 'RENT AUGUST', 800000),
    tx('net1', '2026-07-02', 'NETFLIX.COM'),
    tx('net2', '2026-08-02', 'Netflix'),
  ]);
  assert.equal(result.suggestions.length, 2);
  assert.ok(
    result.suggestions.every((s) => s.confidence === 'RECURRING' && s.frequency === 'MONTHLY'),
  );
  const rent = result.suggestions.find((s) => s.label === 'Rent')!;
  assert.equal(rent.amountOere, 800000);
  assert.equal(rent.source.recordIds.length, 2);
  assert.ok(billMatchScore(tx('future', '2026-09-01', 'RENT'), rent.match) > 0);
  assert.deepEqual(
    billMerchantKeys(tx('a', '2026-09-01', 'rent')),
    billMerchantKeys(tx('b', '2026-09-01', 'husleje')),
  );
});
test('US-10: pending, transfers, unknown amounts and source collisions cannot establish a recurring bill', () => {
  const first = tx('first', '2026-07-01', 'Netflix');
  for (const second of [
    { ...tx('second', '2026-08-01', 'Netflix'), status: 'PENDING' as const },
    { ...tx('second', '2026-08-01', 'Netflix'), amountOere: null },
    {
      ...tx('second', '2026-08-01', 'Netflix'),
      transferEvidence: 'EXPLICIT_INTERNAL_TRANSFER' as const,
    },
    {
      ...tx('second', '2026-08-01', 'Netflix'),
      issues: [
        {
          code: 'SOURCE_ID_COLLISION',
          field: null,
          severity: 'WARNING' as const,
          message: 'Conflict',
        },
      ],
    },
  ]) {
    const result = discover([first, second]);
    assert.ok(result.suggestions.every((s) => s.confidence !== 'RECURRING'));
  }
});
test('US-04/10: known pending Rent is offered as a possible bill with pending evidence', () => {
  const result = discover([
    {
      ...tx('rent1', '2026-07-01', 'Husleje', 850000),
      counterparty: 'Karrébolig',
      status: 'PENDING',
    },
    { ...tx('rent2', '2026-08-01', 'Rent', 850000), status: 'PENDING' },
    { ...tx('rent3', '2026-09-01', 'Husleje', 850000), status: 'PENDING' },
  ]);
  const rent = result.suggestions.find((suggestion) => suggestion.label === 'Rent')!;
  assert.equal(result.suggestions.filter((suggestion) => suggestion.label === 'Rent').length, 1);
  assert.equal(rent.confidence, 'POSSIBLE');
  assert.equal(rent.frequency, 'MONTHLY');
  assert.equal(rent.amountOere, 850000);
  assert.match(rent.source.explanation, /pending/i);
});
test('US-04: repeated shopping and two unfamiliar payments are not silently inserted as fixed bills', () => {
  const shopping = discover([
    tx('a', '2026-07-01', 'Shop'),
    tx('b', '2026-07-05', 'Shop'),
    tx('c', '2026-08-01', 'Shop'),
  ]);
  assert.equal(shopping.suggestions.length, 0);
  const unfamiliar = discover([
    tx('a', '2026-07-01', 'Local provider'),
    tx('b', '2026-08-01', 'Local provider'),
  ]);
  assert.equal(unfamiliar.suggestions[0]!.confidence, 'POSSIBLE');
});

test('US-04: different payees remain distinct despite generic descriptions or a shared Rent alias', () => {
  const records = ['Provider A', 'Provider B'].flatMap((counterparty) =>
    ['2026-07-01', '2026-08-01', '2026-09-01'].map((date) => ({
      ...tx(`${counterparty}-${date}`, date, 'Direct debit'),
      counterparty,
    })),
  );
  const result = discover(records);
  assert.equal(result.suggestions.length, 2);
  assert.ok(result.suggestions.every((s) => s.confidence === 'RECURRING'));
  const providerA = result.suggestions.find((s) => s.label === 'Provider A')!;
  assert.equal(
    billMatchScore({ text: 'Direct debit', counterparty: 'Provider B' }, providerA.match),
    0,
  );
  const rent = discover(records.map((record) => ({ ...record, text: 'Rent' })));
  assert.equal(rent.suggestions.length, 2);
  assert.equal(
    billMatchScore(
      { text: 'Husleje', counterparty: 'Provider B' },
      rent.suggestions.find((s) => s.match.merchantKeys.includes('payee:provider a'))!.match,
    ),
    0,
  );
});
