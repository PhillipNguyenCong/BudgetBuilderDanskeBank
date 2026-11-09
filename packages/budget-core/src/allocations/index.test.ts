import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BudgetPlanSchema } from '@budget-builder/contracts';
import { calculatePlan } from './index.js';
const row = (id: string, amountOere: number) => ({ id, label: id, amountOere });
export const plan = {
  name: 'My budget',
  income: { id: 'income', name: 'Salary', color: 'OCEAN', rows: [row('salary', 2400000)] },
  pots: [
    {
      id: 'spend',
      name: 'Spending',
      color: 'SKY',
      type: 'SPENDING',
      rows: [row('groceries', 800000)],
      rollover: { enabled: false, destination: null, targetPotId: null },
    },
    {
      id: 'savings',
      name: 'Savings',
      color: 'MINT',
      type: 'SAVINGS',
      rows: [row('rainy', 400000)],
    },
  ],
};
test('totals use integer oere without adjusting savings', () => {
  const result = calculatePlan(BudgetPlanSchema.parse(plan));
  assert.equal(result.incomeOere, 2400000);
  assert.equal(result.unallocatedOere, 1200000);
  assert.equal(result.pots[1]?.allocationOere, 400000);
});
test('duplicate row IDs and non-spending rollover settings are rejected', () => {
  assert.equal(
    BudgetPlanSchema.safeParse({
      ...plan,
      income: { ...plan.income, rows: [row('salary', 1), row('salary', 2)] },
    }).success,
    false,
  );
  assert.equal(
    BudgetPlanSchema.safeParse({
      ...plan,
      pots: [
        { ...plan.pots[1], rollover: { enabled: false, destination: null, targetPotId: null } },
      ],
    }).success,
    false,
  );
});

test('aggregate overflow is rejected rather than rounded', () => {
  const input = BudgetPlanSchema.parse({
    ...plan,
    income: { ...plan.income, rows: [row('one', Number.MAX_SAFE_INTEGER), row('two', 1)] },
  });
  assert.throws(() => calculatePlan(input), /AMOUNT_OVERFLOW/);
});
