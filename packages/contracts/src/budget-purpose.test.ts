import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BudgetPlanSchema, createBudgetExample } from './index.js';

test('US-05: car categories preserve reserve semantics and reject non-monthly reserve schedules', () => {
  const plan = structuredClone(createBudgetExample.plan);
  const fixed = plan.pots.find((pot) => pot.type === 'FIXED_EXPENSE')!;
  Object.assign(fixed.rows[0]!, {
    carExpense: { kind: 'INSPECTION', basis: 'MONTHLY_RESERVE' },
    frequency: 'MONTHLY',
  });
  assert.deepEqual(BudgetPlanSchema.parse(JSON.parse(JSON.stringify(plan))), plan);
  Object.assign(fixed.rows[0]!, { frequency: 'YEARLY' });
  assert.equal(BudgetPlanSchema.safeParse(plan).success, false);
  Object.assign(fixed.rows[0]!, {
    carExpense: { kind: 'VEHICLE_TAX', basis: 'PAYMENT' },
    frequency: 'HALF_YEARLY',
  });
  assert.equal(BudgetPlanSchema.safeParse(plan).success, true);
});

test('US-04: spending purposes survive serialization; legacy plans remain valid', () => {
  const legacy = structuredClone(createBudgetExample.plan);
  assert.deepEqual(BudgetPlanSchema.parse(legacy), legacy);
  const spending = legacy.pots.find((p) => p.type === 'SPENDING')!;
  const plan = {
    ...legacy,
    pots: [
      { ...spending, purpose: 'GROCERIES' },
      {
        ...spending,
        id: 'fun',
        purpose: 'FUN',
        rows: [{ id: 'fun-row', label: 'Fun', amountOere: 1 }],
      },
      ...legacy.pots.filter((p) => p.type !== 'SPENDING'),
    ],
  };
  assert.deepEqual(BudgetPlanSchema.parse(JSON.parse(JSON.stringify(plan))), plan);
  assert.equal(
    BudgetPlanSchema.safeParse({
      ...plan,
      pots: plan.pots.map((p) => (p.id === 'fun' ? { ...p, purpose: 'GROCERIES' } : p)),
    }).success,
    false,
  );
  for (const type of ['INCOME', 'FIXED_EXPENSE', 'SAVINGS']) {
    const invalid = structuredClone(legacy);
    Object.assign(type === 'INCOME' ? invalid.income : invalid.pots.find((p) => p.type === type)!, {
      purpose: 'FUN',
    });
    assert.equal(BudgetPlanSchema.safeParse(invalid).success, false);
  }
});
