import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BudgetPlanSchema, createBudgetExample } from '@budget-builder/contracts';
import { calculatePlan, monthlyBillAllocation, validateAllocation } from './index.js';

test('bill frequencies derive equal monthly allocations without changing payment amounts', () => {
  assert.equal(monthlyBillAllocation(30000), 30000);
  assert.equal(monthlyBillAllocation(90000, 'QUARTERLY'), 30000);
  assert.equal(monthlyBillAllocation(180000, 'HALF_YEARLY'), 30000);
  assert.equal(monthlyBillAllocation(360000, 'YEARLY'), 30000);
  const plan = BudgetPlanSchema.parse(createBudgetExample.plan);
  const fixed = plan.pots.find((p) => p.type === 'FIXED_EXPENSE')!;
  fixed.rows = [
    { id: 'monthly', label: 'Monthly', amountOere: 30000 },
    { id: 'quarterly', label: 'Quarterly', amountOere: 90000, frequency: 'QUARTERLY' },
    { id: 'half-yearly', label: 'Half yearly', amountOere: 180000, frequency: 'HALF_YEARLY' },
    { id: 'yearly', label: 'Yearly', amountOere: 360000, frequency: 'YEARLY' },
  ];
  const original = structuredClone(plan);
  assert.equal(calculatePlan(plan).pots.find((p) => p.id === fixed.id)?.allocationOere, 120000);
  assert.deepEqual(plan, original);
  plan.income.rows[0]!.amountOere = 1;
  assert.throws(() => validateAllocation(plan), /OVER_ALLOCATED/);
});

test('bill rounding uses exact oere and handles zero, boundaries and aggregate overflow', () => {
  assert.equal(monthlyBillAllocation(100, 'QUARTERLY'), 34);
  assert.equal(monthlyBillAllocation(1, 'YEARLY'), 1);
  assert.equal(monthlyBillAllocation(0, 'YEARLY'), 0);
  const max = Number.MAX_SAFE_INTEGER;
  assert.equal(monthlyBillAllocation(max, 'YEARLY'), Number((BigInt(max) + 11n) / 12n));
  for (const invalid of [-1, 1.5, NaN, Infinity, max + 1])
    assert.throws(() => monthlyBillAllocation(invalid));
  const plan = structuredClone(createBudgetExample.plan);
  const fixed = plan.pots.find((p) => p.type === 'FIXED_EXPENSE')!;
  fixed.rows = [
    { id: 'max', label: 'Max', amountOere: max },
    { id: 'extra', label: 'Extra', amountOere: 1 },
  ];
  assert.throws(() => calculatePlan(plan), /AMOUNT_OVERFLOW/);
});

test('legacy bills retain monthly totals', () => {
  assert.equal(calculatePlan(createBudgetExample.plan).unallocatedOere, 0);
  assert.equal(
    calculatePlan(createBudgetExample.plan).pots.find((p) => p.id === 'bills')?.allocationOere,
    1200000,
  );
});
