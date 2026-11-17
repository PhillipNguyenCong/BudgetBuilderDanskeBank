import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Transaction } from '@budget-builder/contracts';
import { suggestSalary } from './index.js';
const tx = (
  id: string,
  date: string,
  amountOere = 2500000,
  counterparty = 'Employer',
): Transaction => ({
  id,
  sourceId: id,
  accountId: 'account',
  date,
  dateBasis: 'BOOKED_ON',
  direction: 'CREDIT',
  status: 'BOOKED',
  amountOere,
  original: { amount: null, currency: 'DKK' },
  conversionBasis: 'DKK_AMOUNT',
  text: 'Salary',
  counterparty,
  issues: [],
});
const suggest = (transactions: Transaction[]) =>
  suggestSalary({ accountId: 'account', date: '2026-09-03', transactions });
test('US-04: uses the latest main salary, ranking source coverage before totals and excluding duplicates', () => {
  const june = tx('june', '2026-06-30');
  const latest = tx('august', '2026-08-31', 2700000);
  const result = suggest([june, june, latest, tx('side', '2026-08-30', 9000000, 'Other employer')]);
  assert.deepEqual(result.suggestion, {
    amountOere: 2700000,
    paymentDate: '2026-08-31',
    transactionId: 'august',
  });
});
test('US-10: excludes unrelated credits, refunds, transfers, pending, future, old, foreign and unknown amounts', () => {
  const good = tx('good', '2026-08-31');
  const result = suggest([
    good,
    { ...good, id: 'pending', sourceId: 'pending', status: 'PENDING' },
    {
      ...good,
      id: 'transfer',
      sourceId: 'transfer',
      transferEvidence: 'EXPLICIT_INTERNAL_TRANSFER',
    },
    { ...good, id: 'refund', sourceId: 'refund', text: 'Salary refund' },
    { ...good, id: 'credit', sourceId: 'credit', text: 'Money received' },
    { ...good, id: 'unknown', sourceId: 'unknown', amountOere: null },
    { ...tx('future', '2026-09-04') },
    { ...tx('old', '2025-09-03') },
    { ...tx('foreign', '2026-08-31'), accountId: 'other' },
  ]);
  assert.equal(result.suggestion?.transactionId, 'good');
  assert.equal(suggest([]).suggestion, null);
});
test('US-10: tied main sources and conflicting source versions leave salary manual', () => {
  assert.equal(
    suggest([
      tx('a', '2026-08-31', 2500000, 'Employer A'),
      tx('b', '2026-08-31', 2500000, 'Employer B'),
    ]).suggestion,
    null,
  );
  const a = tx('a', '2026-08-31');
  assert.equal(suggest([a, { ...a, id: 'conflict', amountOere: 100 }]).suggestion, null);
});
test('US-04: uses total as a source tie-break and recognises Danish salary', () => {
  const result = suggest([
    { ...tx('a', '2026-08-31', 2700000, 'A'), text: 'Løn august' },
    tx('b', '2026-08-31', 1000000, 'B'),
  ]);
  assert.equal(result.suggestion?.amountOere, 2700000);
});
