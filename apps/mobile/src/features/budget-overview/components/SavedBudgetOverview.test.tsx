import { calculatePlan } from '@budget-builder/budget-core/allocations';
import { createBudgetExample, type Budget } from '@budget-builder/contracts';
import { render, screen } from '@testing-library/react-native';
import { SavedBudgetOverview } from './SavedBudgetOverview';

it('shows the saved payment frequency separately from its monthly allocation', async () => {
  const plan = structuredClone(createBudgetExample.plan);
  const fixed = plan.pots.find((p) => p.type === 'FIXED_EXPENSE')!;
  fixed.rows = [{ id: 'annual', label: 'Insurance', amountOere: 360000, frequency: 'YEARLY' }];
  const budget: Budget = {
    id: 'saved',
    accountId: 'account',
    revision: 1,
    createdAt: '2026-11-09T12:00:00Z',
    updatedAt: '2026-11-09T12:00:00Z',
    plan,
    totals: calculatePlan(plan),
  };
  await render(<SavedBudgetOverview budget={budget} />);
  expect(screen.getByText('Insurance: DKK 3,600')).toBeVisible();
  expect(screen.getByText('Yearly · DKK 300/month')).toBeVisible();
  expect(screen.getByText('Allocated: DKK 12,300')).toBeVisible();
});
