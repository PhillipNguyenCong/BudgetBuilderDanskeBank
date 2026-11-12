import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createBudgetExample, type Transaction } from '@budget-builder/contracts';
import { calculateGuidance, buildSpendingSnapshot } from './index.js';

test('US-06: exact next-seven-day guidance, final day, exhaustion and overspending', () => {
  const result = calculateGuidance(800000, 0, 520000, '2026-10-15');
  assert.equal(result.remainingOere, 280000);
  assert.equal(result.weeklyGuideDkk, 1153);
  assert.equal(result.dailyGuideDkk, 165);
  assert.equal(calculateGuidance(280000, 0, 0, '2026-10-31').weeklyGuideDkk, 2800);
  assert.equal(calculateGuidance(800000, 0, 830000, '2026-10-15').overspentOere, 30000);
  assert.equal(calculateGuidance(800000, 0, 830000, '2026-10-15').weeklyGuideDkk, 0);
  assert.equal(calculateGuidance(10000, 0, 10000, '2026-02-28').dailyGuideDkk, 0);
  assert.equal(calculateGuidance(20000, 0, 0, '2028-02-28').dailyGuideDkk, 100);
  assert.throws(() => calculateGuidance(Number.MAX_SAFE_INTEGER, 1, 0, '2026-10-15'));
});

const transaction = (id: string, text: string, amountOere = 50000): Transaction => ({
  id,
  sourceId: id,
  accountId: 'demo-account',
  date: '2026-10-15',
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
const snapshot = (
  transactions: Transaction[],
  corrections: Parameters<typeof buildSpendingSnapshot>[0]['corrections'] = [],
) =>
  buildSpendingSnapshot({
    plan: createBudgetExample.plan,
    accountId: 'demo-account',
    transactions,
    corrections,
    date: '2026-10-15',
    coverage: { from: '2026-10-01', to: '2026-10-15', completeMonths: 0 },
  });

test('US-06: bill matching, default spending and purchases update remaining automatically', () => {
  const before = snapshot([transaction('rent', 'Rent', 900000)]);
  assert.equal(before.overall.recordedSpendingOere, 0);
  const after = snapshot([
    transaction('rent', 'Rent', 900000),
    transaction('shop', 'Grocery shop'),
  ]);
  assert.equal(after.overall.remainingOere, 750000);
  assert.equal(after.activity.find((a) => a.transaction.id === 'shop')!.potId, 'spending');
  assert.equal(after.activity.find((a) => a.transaction.id === 'rent')!.potId, 'bills');
});

test('US-04/06: manually named Husleje and Netflix bills use known aliases without merchant metadata', () => {
  const plan = structuredClone(createBudgetExample.plan);
  const fixed = plan.pots.find((pot) => pot.type === 'FIXED_EXPENSE')!;
  fixed.rows = [
    { id: 'rent-alias', label: 'Husleje', amountOere: 900000 },
    { id: 'netflix-alias', label: 'Netflix', amountOere: 9900 },
  ];
  const result = buildSpendingSnapshot({
    plan,
    accountId: 'demo-account',
    transactions: [
      transaction('rent', 'RENT OCTOBER', 900000),
      transaction('netflix', 'NETFLIX.COM', 9900),
      transaction('shop', 'Other purchase'),
    ],
    corrections: [],
    date: '2026-10-15',
    coverage: { from: '2026-10-01', to: '2026-10-15', completeMonths: 0 },
  });
  assert.equal(
    result.activity.find((item) => item.transaction.id === 'rent')!.billRowId,
    'rent-alias',
  );
  assert.equal(
    result.activity.find((item) => item.transaction.id === 'netflix')!.billRowId,
    'netflix-alias',
  );
  assert.equal(result.overall.recordedSpendingOere, 50000);
});

test('US-04/06: a conflicting named payee cannot bypass saved merchant identity through the bill label', () => {
  for (const label of ['Rent', 'Direct debit']) {
    const plan = structuredClone(createBudgetExample.plan);
    const fixed = plan.pots.find((pot) => pot.type === 'FIXED_EXPENSE')!;
    fixed.rows = [
      {
        id: 'provider-a',
        label,
        amountOere: 900000,
        match: {
          merchantKeys: [
            'payee:provider a',
            label === 'Rent' ? 'known:rent' : 'description:direct debit',
          ],
        },
      },
    ];
    const result = buildSpendingSnapshot({
      plan,
      accountId: 'demo-account',
      transactions: [{ ...transaction('other-payee', label), counterparty: 'Provider B' }],
      corrections: [],
      date: '2026-10-15',
      coverage: { from: '2026-10-01', to: '2026-10-15', completeMonths: 0 },
    });
    assert.equal(result.activity[0]!.potId, 'spending');
    assert.equal(result.overall.recordedSpendingOere, 50000);
  }
});

test('US-08/10: transfers, pending movements, credits, duplicates and missing amounts stay distinct', () => {
  const shop = transaction('shop', 'Shop');
  const result = snapshot([
    shop,
    shop,
    { ...transaction('pending', 'Shop'), status: 'PENDING' },
    { ...transaction('transfer', 'Move money'), transferEvidence: 'EXPLICIT_INTERNAL_TRANSFER' },
    { ...transaction('credit', 'Money in'), direction: 'CREDIT' },
  ]);
  assert.equal(result.activity.length, 4);
  assert.equal(result.overall.recordedSpendingOere, 50000);
  assert.equal(result.overall.pendingSpendingOere, 50000);
  assert.equal(result.overall.remainingOere, 700000);
  const incomplete = snapshot([{ ...shop, amountOere: null }]);
  assert.equal(incomplete.overall.remainingOere, null);
  assert.equal(incomplete.overall.weeklyGuideDkk, null);
  assert.equal(incomplete.activity.length, 1);
});

test('US-10: ambiguous matches, source collisions, unknown direction/status/date and partial coverage are explicit', () => {
  for (const tx of [
    { ...transaction('a', 'Shop'), direction: 'UNKNOWN' as const },
    { ...transaction('a', 'Shop'), date: null },
  ]) {
    const result = snapshot([tx]);
    assert.equal(result.overall.weeklyGuideDkk, null);
    assert.equal(result.activity[0]!.needsReview, true);
  }
  const unknownStatus = snapshot([{ ...transaction('status', 'Shop'), status: 'UNKNOWN' }]);
  assert.equal(unknownStatus.overall.unconfirmedSpendingOere, 50000);
  assert.equal(unknownStatus.overall.remainingOere, 750000);
  assert.notEqual(unknownStatus.overall.weeklyGuideDkk, null);
  assert.equal(unknownStatus.activity[0]!.needsReview, true);
  const plan = structuredClone(createBudgetExample.plan);
  plan.pots.push({
    ...plan.pots[0]!,
    id: 'other',
    rows: [{ id: 'duplicate-label', label: 'Groceries', amountOere: 0 }],
  });
  const ambiguous = buildSpendingSnapshot({
    plan,
    accountId: 'demo-account',
    transactions: [transaction('a', 'Groceries')],
    corrections: [],
    date: '2026-10-15',
    coverage: { from: '2026-10-02', to: '2026-10-15', completeMonths: 0 },
  });
  assert.equal(ambiguous.activity[0]!.potId, null);
  assert.equal(ambiguous.overall.remainingOere, null);
  assert.ok(ambiguous.overall.limitations.some((message) => message.includes('coverage')));
});

test('US-06: pending bills reduce fixed expenses while other pending debits reduce Spending', () => {
  const result = snapshot([
    { ...transaction('rent-pending', 'Husleje', 900000), status: 'PENDING' },
    { ...transaction('shop-pending', 'Coffee', 5000), status: 'PENDING' },
  ]);
  assert.equal(result.overall.recordedSpendingOere, 0);
  assert.equal(result.overall.pendingSpendingOere, 5000);
  assert.equal(result.overall.remainingOere, 795000);
  assert.equal(result.fixedExpenses[0]!.numbers.pendingSpendingOere, 900000);
  assert.equal(result.fixedExpenses[0]!.numbers.remainingOere, 300000);
});

test('US-06/10: pending-to-booked replacement counts once and a cancellation releases it', () => {
  const pending = { ...transaction('pending-version', 'Coffee', 5000), sourceId: 'movement' };
  const booked = {
    ...pending,
    id: 'booked-version',
    status: 'BOOKED' as const,
  };
  const transitioned = snapshot([{ ...pending, status: 'PENDING' }, booked]);
  assert.equal(transitioned.overall.recordedSpendingOere, 5000);
  assert.equal(transitioned.overall.pendingSpendingOere, 0);
  assert.equal(transitioned.overall.remainingOere, 795000);
  assert.equal(transitioned.activity.filter((item) => item.contribution !== 'NONE').length, 1);

  const cancelled = snapshot([
    { ...pending, status: 'PENDING' },
    { ...pending, id: 'cancelled-version', status: 'CANCELLED' },
  ]);
  assert.equal(cancelled.overall.recordedSpendingOere, 0);
  assert.equal(cancelled.overall.pendingSpendingOere, 0);
  assert.equal(cancelled.overall.remainingOere, 800000);
});

test('US-10: a conflicting source id contributes at most one known debit and stays reviewable', () => {
  const issue = {
    code: 'SOURCE_ID_COLLISION',
    field: 'id',
    severity: 'WARNING' as const,
    message: 'Conflicting versions.',
  };
  const result = snapshot([
    { ...transaction('first', 'Coffee', 100), sourceId: 'collision', issues: [issue] },
    { ...transaction('second', 'Coffee', 200), sourceId: 'collision', issues: [issue] },
  ]);
  assert.ok([100, 200].includes(result.overall.recordedSpendingOere));
  assert.notEqual(result.overall.weeklyGuideDkk, null);
  assert.equal(result.activity.filter((item) => item.needsReview).length, 2);
  assert.equal(result.activity.filter((item) => item.contribution === 'BOOKED').length, 1);
});

test('US-06: a confirmed fixed-expense refund restores that fixed pot', () => {
  const refund = { ...transaction('refund', 'Rent refund', 10000), direction: 'CREDIT' as const };
  const result = snapshot(
    [refund],
    [
      {
        transactionId: refund.id,
        sourceId: refund.sourceId,
        revision: 1,
        decision: { kind: 'REFUND', potId: 'bills' },
        updatedAt: '2026-10-15T12:00:00Z',
      },
    ],
  );
  assert.equal(result.fixedExpenses[0]!.numbers.recordedSpendingOere, -10000);
  assert.equal(result.fixedExpenses[0]!.numbers.remainingOere, 1210000);
});

test('US-06: overall guide uses signed combined remainder, not the sum of positive pot guides', () => {
  const plan = structuredClone(createBudgetExample.plan);
  plan.pots[0]!.rows[0]!.amountOere = 10000;
  plan.pots.push({
    ...plan.pots[0]!,
    id: 'transport',
    name: 'Transport',
    rows: [{ id: 'transport-row', label: 'Travel', amountOere: 100000 }],
  });
  const result = buildSpendingSnapshot({
    plan,
    accountId: 'demo-account',
    transactions: [transaction('a', 'Groceries', 30000)],
    corrections: [],
    date: '2026-10-15',
    coverage: { from: '2026-10-01', to: '2026-10-15', completeMonths: 0 },
  });
  assert.equal(result.pots[0]!.numbers.overspentOere, 20000);
  assert.equal(result.overall.remainingOere, 80000);
  assert.equal(result.overall.weeklyGuideDkk, 329);
});

test('US-10: foreign, future and prior-month records cannot alter current-month spending', () => {
  const result = snapshot([
    { ...transaction('foreign', 'Shop'), accountId: 'foreign-account' },
    { ...transaction('future', 'Shop'), date: '2026-10-16' },
    { ...transaction('old', 'Shop'), date: '2026-09-30' },
  ]);
  assert.equal(result.activity.length, 2);
  assert.equal(result.overall.recordedSpendingOere, 0);
  assert.equal(result.overall.remainingOere, 800000);
});

test('US-06: changed source corrections remain reviewable until explicitly replaced or reset', () => {
  const correction = {
    transactionId: 'previous-version',
    sourceId: 'source',
    revision: 1,
    decision: { kind: 'TRANSFER' as const, potId: null },
    updatedAt: '2026-10-15T12:00:00Z',
  };
  const tx = { ...transaction('new-version', 'Shop'), sourceId: 'source' };
  const changed = snapshot([tx], [correction]);
  assert.equal(changed.retainedCorrectionCount, 1);
  assert.equal(changed.activity[0]!.kind, 'UNKNOWN');
  const reset = snapshot(
    [tx],
    [correction, { ...correction, transactionId: tx.id, decision: null }],
  );
  assert.equal(reset.overall.recordedSpendingOere, 50000);
});
