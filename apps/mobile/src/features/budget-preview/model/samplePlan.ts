import { createBudgetExample, type BudgetPlan } from '@budget-builder/contracts';
export function samplePlan(): BudgetPlan {
  // Independently authored API example, never account-derived data.
  const plan = JSON.parse(JSON.stringify(createBudgetExample.plan)) as BudgetPlan;
  plan.name = 'Sample monthly budget';
  plan.pots[1]!.rows[2]!.source = {
    kind: 'SUGGESTED',
    explanation:
      'Sample calculation: DKK 2,700 quarterly divided by three gives DKK 900 per month.',
    recordIds: [],
    period: null,
  };
  return plan;
}
