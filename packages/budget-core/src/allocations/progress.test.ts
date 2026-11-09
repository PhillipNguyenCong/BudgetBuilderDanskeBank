import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calculateAllocationProgress, type DraftAmount, calculatePlan } from './index.js';
import { createBudgetExample } from '@budget-builder/contracts';

const pots = (amounts: DraftAmount[]) =>
  amounts.map((amount, index) => ({ id: `pot-${index}`, amounts: [amount] }));
test('US-04: partial guidance follows 17000 → 9000 → 7000 → 0 without filling blanks', () => {
  for (const [amounts, remaining, missing] of [
    [[null, null, null], 1700000, 3],
    [[800000, null, null], 900000, 2],
    [[800000, 200000, null], 700000, 1],
    [[800000, 200000, 700000], 0, 0],
  ] as const) {
    const input = pots([...amounts]);
    const before = structuredClone(input);
    const result = calculateAllocationProgress([1700000], input);
    assert.equal(result.status, 'ready');
    if (result.status === 'ready') {
      assert.equal(result.remainingOere, remaining);
      assert.equal(result.missingPotAmounts, missing);
    }
    assert.deepEqual(input, before);
  }
});
test('income must be complete; invalid nonblank amounts suspend guidance', () => {
  for (const income of [[], [null], [100, null]]) {
    assert.equal(calculateAllocationProgress(income, pots([null])).status, 'income-incomplete');
  }
  for (const invalid of ['invalid', -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1] as const) {
    assert.equal(calculateAllocationProgress([1000], pots([invalid])).status, 'invalid');
    assert.equal(calculateAllocationProgress([invalid], pots([0])).status, 'invalid');
  }
});
test('zero is explicit and partial pot metadata distinguishes all blank from partly entered', () => {
  const result = calculateAllocationProgress(
    [0],
    [
      { id: 'blank', amounts: [null, null] },
      { id: 'partial', amounts: [0, null] },
      { id: 'zero', amounts: [0] },
      { id: 'removed-rows', amounts: [] },
    ],
  );
  assert.equal(result.status, 'ready');
  assert.deepEqual(
    result.pots.map((pot) => pot.status),
    ['not-entered', 'incomplete', 'complete', 'complete'],
  );
  if (result.status === 'ready') assert.equal(result.remainingOere, 0);
});
test('multiple incomes and pots agree with authoritative totals independent of ordering', () => {
  const plan = structuredClone(createBudgetExample.plan);
  plan.income.rows.push({ id: 'extra-income', label: 'Extra', amountOere: 101 });
  const input = plan.pots.map((pot) => ({
    id: pot.id,
    amounts: pot.rows.map((row) => row.amountOere),
  }));
  const result = calculateAllocationProgress(
    plan.income.rows.map((row) => row.amountOere),
    input.reverse(),
  );
  assert.equal(result.status, 'ready');
  if (result.status === 'ready')
    assert.equal(result.remainingOere, calculatePlan(plan).unallocatedOere);
});
test('over-allocation remains negative; aggregate overflow is explicit', () => {
  const result = calculateAllocationProgress([100], pots([201, null]));
  if (result.status !== 'ready') assert.fail('Expected provisional guidance');
  assert.equal(result.remainingOere, -101);
  assert.equal(
    calculateAllocationProgress([Number.MAX_SAFE_INTEGER, 1], pots([0])).status,
    'overflow',
  );
  assert.equal(
    calculateAllocationProgress([0], pots([Number.MAX_SAFE_INTEGER, 1])).status,
    'overflow',
  );
});
