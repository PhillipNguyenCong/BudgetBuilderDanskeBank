import assert from 'node:assert/strict';
import { test } from 'node:test';
import { allocateAutoBudget } from './index.js';

test('US-04: auto budget uses actual bills and the agreed percentage splits', () => {
  for (const [bills, groceries, fun, savings, split] of [
    [800000, 200000, 600000, 400000, '50/30/20'],
    [1200000, 500000, 100000, 200000, '85/5/10'],
    [1300000, 400000, 100000, 200000, '85/5/10'],
    [1400000, 300000, 100000, 200000, '85/5/10'],
    [0, 1000000, 600000, 400000, '50/30/20'],
  ] as const) {
    assert.deepEqual(allocateAutoBudget(2000000, [{ amountOere: bills }]), {
      incomeOere: 2000000,
      fixedExpensesOere: bills,
      groceriesOere: groceries,
      funOere: fun,
      savingsOere: savings,
      split,
    });
  }
});

test('US-04: exact thresholds, zero groceries and bills exceeding capacity', () => {
  assert.equal(allocateAutoBudget(2000000, [{ amountOere: 1000000 }]).groceriesOere, 0);
  assert.equal(allocateAutoBudget(2000000, [{ amountOere: 1000000 }]).split, '50/30/20');
  assert.equal(allocateAutoBudget(2000000, [{ amountOere: 1000001 }]).split, '85/5/10');
  assert.equal(allocateAutoBudget(2000000, [{ amountOere: 1700000 }]).groceriesOere, 0);
  assert.throws(
    () => allocateAutoBudget(2000000, [{ amountOere: 1700001 }]),
    /BILLS_EXCEED_CAPACITY/,
  );
});

test('NFR-04: monthly bill rounding and percentage remainders stay exact without mutating payments', () => {
  const bills = [
    { amountOere: 100001, frequency: 'QUARTERLY' as const },
    { amountOere: 120001, frequency: 'YEARLY' as const },
  ];
  const original = structuredClone(bills);
  const result = allocateAutoBudget(2000003, bills);
  assert.equal(result.fixedExpensesOere, 43335);
  assert.equal(result.groceriesOere, 956666);
  assert.equal(result.funOere, 600000);
  assert.equal(result.savingsOere, 400002);
  assert.deepEqual(bills, original);
  for (const income of [1, 2, 3, 99, 101, Number.MAX_SAFE_INTEGER]) {
    const plan = allocateAutoBudget(income, []);
    assert.equal(
      BigInt(plan.fixedExpensesOere) +
        BigInt(plan.groceriesOere) +
        BigInt(plan.funOere) +
        BigInt(plan.savingsOere),
      BigInt(income),
    );
  }
  const fallback = allocateAutoBudget(2000003, [{ amountOere: 1300000 }]);
  assert.equal(fallback.groceriesOere, 400002);
  assert.equal(fallback.funOere, 100000);
  assert.equal(fallback.savingsOere, 200001);
});

test('US-10: invalid income, invalid bills and overflow never become guessed allocations', () => {
  for (const income of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])
    assert.throws(() => allocateAutoBudget(income, []), /INVALID_INCOME/);
  for (const amountOere of [-1, 0.5, NaN, Number.MAX_SAFE_INTEGER + 1])
    assert.throws(() => allocateAutoBudget(2000000, [{ amountOere }]), /AMOUNT_OVERFLOW/);
  assert.throws(
    () =>
      allocateAutoBudget(Number.MAX_SAFE_INTEGER, [
        { amountOere: Number.MAX_SAFE_INTEGER },
        { amountOere: 1 },
      ]),
    /AMOUNT_OVERFLOW/,
  );
});
