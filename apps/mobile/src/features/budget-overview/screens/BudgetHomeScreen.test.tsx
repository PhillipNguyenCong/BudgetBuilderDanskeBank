import { calculatePlan } from '@budget-builder/budget-core/allocations';
import { BudgetSchema, createBudgetExample } from '@budget-builder/contracts';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { useState } from 'react';
import { BudgetHomeScreen } from './BudgetHomeScreen';
import { spendingSummary } from '../../../tests/spendingFixtures';
jest.mock('../api', () => ({
  getSpendingSummary: jest.fn(async () => {
    throw new Error('Spending unavailable in this fixture.');
  }),
}));

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
beforeEach(() => jest.clearAllMocks());
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
  expect(screen.getByText('Income: DKK 24,000')).toBeVisible();
  expect(screen.getByText('Forecast unavailable')).toBeVisible();
  await fireEvent.press(screen.getByRole('button', { name: 'Choose budget' }));
  expect(screen.getByRole('radio', { name: 'Household' })).toBeChecked();
  expect(screen.getByRole('radio', { name: 'My budget' })).not.toBeChecked();
  await fireEvent.press(screen.getByRole('radio', { name: 'My budget' }));
  expect(callbacks.onSelect).toHaveBeenCalledWith('one');
  expect(screen.queryByRole('radio')).toBeNull();
});

it('US-06/10: an unavailable selection offers explicit selection without opening a different budget', async () => {
  await render(<BudgetHomeScreen {...callbacks} selectedId="missing" load={async () => [saved]} />);
  expect(
    await screen.findByText(
      'The selected budget is unavailable. Choose one of your saved budgets above.',
    ),
  ).toBeVisible();
  expect(screen.queryByText('Monthly plan')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Choose budget' }));
  await fireEvent.press(screen.getByRole('radio', { name: 'My budget' }));
  expect(callbacks.onSelect).toHaveBeenCalledWith('one');
});

it('US-06: refreshes on re-entry, cancels abandoned reads and closes details on replacement', async () => {
  const load = jest.fn(async (_signal?: AbortSignal) => [saved]);
  const view = await render(<BudgetHomeScreen {...callbacks} active load={load} />);
  await screen.findByRole('button', { name: 'View Fixed expenses details' });
  await view.rerender(<BudgetHomeScreen {...callbacks} active={false} load={load} />);
  expect(load.mock.calls[0]![0]!.aborted).toBe(true);
  await view.rerender(<BudgetHomeScreen {...callbacks} active load={load} />);
  await waitFor(() => expect(load).toHaveBeenCalledTimes(2));
  expect(await screen.findByText('Monthly plan')).toBeVisible();
  expect(screen.queryByText('Rent: DKK 9,000')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Choose budget' })).toBeNull();
});

it('US-06: shows source snapshot guides and preserves the saved plan on independent spending failure', async () => {
  const load = async () => [saved];
  const loadSpending = jest
    .fn()
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce(spendingSummary(saved));
  await render(<BudgetHomeScreen {...callbacks} load={load} loadSpending={loadSpending} />);
  expect(
    await screen.findByText('Spending unavailable. offline Your saved plan is still available.'),
  ).toBeVisible();
  expect(screen.getByText('Income: DKK 24,000')).toBeVisible();
  await fireEvent.press(screen.getByRole('button', { name: 'Retry spending' }));
  expect(await screen.findByText('Left to spend this month')).toBeVisible();
  expect(screen.getByText('About DKK 165 per day · 17 days remaining')).toBeVisible();
  expect(screen.getByText('Demo snapshot · 2026-10-15')).toBeVisible();
});

it('US-06/10: recovers an unavailable selection when only one saved budget remains', async () => {
  const load = async () => [saved];
  function RecoverableBudget() {
    const [selectedId, select] = useState('missing');
    return (
      <BudgetHomeScreen {...callbacks} selectedId={selectedId} onSelect={select} load={load} />
    );
  }
  await render(<RecoverableBudget />);
  await fireEvent.press(await screen.findByRole('button', { name: 'Choose budget' }));
  await fireEvent.press(screen.getByRole('radio', { name: 'My budget' }));
  expect(screen.getByRole('header', { name: 'My budget' })).toBeVisible();
  expect(screen.getByText('Monthly plan')).toBeVisible();
  expect(screen.queryByRole('button', { name: 'Choose budget' })).toBeNull();
  expect(screen.queryByRole('radio')).toBeNull();
});
