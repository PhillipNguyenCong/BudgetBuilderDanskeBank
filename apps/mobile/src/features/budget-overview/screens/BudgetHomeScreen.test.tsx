import { calculatePlan } from '@budget-builder/budget-core/allocations';
import { BudgetSchema, createBudgetExample } from '@budget-builder/contracts';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { BudgetHomeScreen } from './BudgetHomeScreen';

const saved = BudgetSchema.parse({
  id: 'one',
  accountId: 'demo-account',
  revision: 1,
  createdAt: '2026-11-09T12:00:00Z',
  updatedAt: '2026-11-09T12:00:00Z',
  plan: createBudgetExample.plan,
  totals: calculatePlan(createBudgetExample.plan),
});
const callbacks = { onCreate: jest.fn(), onPreview: jest.fn(), onSelect: jest.fn() };
it('US-01/03: failed budget loading never shows a false first-budget introduction', async () => {
  const load = jest.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([]);
  await render(<BudgetHomeScreen {...callbacks} load={load} />);
  expect(
    await screen.findByText('Could not load your saved budgets. No saved plans have been changed.'),
  ).toBeVisible();
  expect(screen.queryByText('Your money, organised')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByText('Your money, organised')).toBeVisible();
});
it('US-03: reopens the selected plan separately from other budgets and discloses unavailable forecasts', async () => {
  const other = {
    ...saved,
    id: 'two',
    accountId: 'other-account',
    plan: { ...saved.plan, name: 'Household' },
  };
  await render(
    <BudgetHomeScreen {...callbacks} selectedId="two" load={async () => [saved, other]} />,
  );
  expect(await screen.findByRole('header', { name: 'Household' })).toBeVisible();
  expect(screen.getByText('Take-home salary: DKK 24,000')).toBeVisible();
  expect(screen.getByText('Forecast unavailable')).toBeVisible();
  await fireEvent.press(screen.getByRole('button', { name: 'Open My budget' }));
  expect(callbacks.onSelect).toHaveBeenCalledWith('one');
});
