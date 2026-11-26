import { calculatePlan } from '@budget-builder/budget-core/allocations';
import { BudgetSchema, createBudgetExample } from '@budget-builder/contracts';
import { fireEvent, render, screen, within, waitFor } from '@testing-library/react-native';
import { useState } from 'react';
import { BudgetHomeScreen } from './BudgetHomeScreen';
import { spendingSummary } from '../../../tests/spendingFixtures';
jest.mock('../api', () => ({
  getBudgetActivity: jest.fn(async () =>
    require('../../../tests/spendingFixtures').activityPage([]),
  ),
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
  expect(screen.getAllByText('24.000 kr.')[0]!).toBeVisible();
  expect(screen.queryByText('Forecast unavailable')).toBeNull();
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
  expect(screen.queryByText('Left after bills and savings')).toBeNull();
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
  expect(await screen.findByRole('button', { name: 'View Monthly salary details' })).toBeVisible();
  expect(screen.queryByText('Rent: 9.000 kr.')).toBeNull();
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
  expect(screen.getAllByText('24.000 kr.')[0]!).toBeVisible();
  await fireEvent.press(screen.getByRole('button', { name: 'Retry spending' }));
  expect(await screen.findByRole('button', { name: 'View Monthly salary details' })).toBeVisible();
  expect(screen.getByText('2.800 kr.')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Budget details' })).toBeVisible();
  expect(screen.queryByRole('button', { name: 'Refresh budgets' })).toBeNull();
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
  expect(screen.getByRole('button', { name: 'View Monthly salary details' })).toBeVisible();
  expect(screen.queryByRole('button', { name: 'Choose budget' })).toBeNull();
  expect(screen.queryByRole('radio')).toBeNull();
});

it('US-06/12: changes monthly views without showing current weekly guides in history', async () => {
  const current = {
    ...spendingSummary(saved),
    sourceSnapshotDate: '2026-10-15',
    availableMonths: ['2026-09', '2026-10'],
  };
  const loadSpending = jest.fn(async (_id: string, _signal?: AbortSignal, month?: string) =>
    month === '2026-09'
      ? { ...current, month: '2026-09', snapshotDate: '2026-09-30', daysRemaining: 1 }
      : current,
  );
  const load = async () => [saved];
  const onOpenBudgetLog = jest.fn();
  const view = await render(
    <BudgetHomeScreen
      {...callbacks}
      selectedId="one"
      load={load}
      loadSpending={loadSpending}
      onOpenBudgetLog={onOpenBudgetLog}
    />,
  );
  expect(await screen.findByText('October 2026')).toBeVisible();
  await fireEvent.press(screen.getByRole('button', { name: 'Budget log' }));
  expect(onOpenBudgetLog).toHaveBeenCalledWith('one');
  await view.rerender(
    <BudgetHomeScreen
      {...callbacks}
      selectedId="one"
      month="2026-09"
      load={load}
      loadSpending={loadSpending}
      onOpenBudgetLog={onOpenBudgetLog}
    />,
  );
  expect(await screen.findByText('Historical view · Current plan applied')).toBeVisible();
  expect(loadSpending).toHaveBeenLastCalledWith('one', expect.any(AbortSignal), '2026-09');
  expect(screen.getByText('Remaining in September 2026')).toBeVisible();
  expect(screen.queryByText('About 1.153 kr. for the next 7 days')).toBeNull();
  await view.rerender(
    <BudgetHomeScreen
      {...callbacks}
      selectedId="one"
      load={load}
      loadSpending={loadSpending}
      onOpenBudgetLog={onOpenBudgetLog}
    />,
  );
  expect(await screen.findByText('Left after bills and savings')).toBeVisible();
  expect(screen.queryByText('Historical view · Current plan applied')).toBeNull();
});

it('US-10: undated records have their own review action', async () => {
  const onOpenUndated = jest.fn();
  await render(
    <BudgetHomeScreen
      {...callbacks}
      selectedId="one"
      load={async () => [saved]}
      loadSpending={async () => ({ ...spendingSummary(saved), undatedReviewCount: 2 })}
      onOpenUndated={onOpenUndated}
    />,
  );
  await fireEvent.press(await screen.findByRole('button', { name: 'Review undated records (2)' }));
  expect(onOpenUndated).toHaveBeenCalledWith('one');
});

it('keeps the last spending snapshot on refresh failure and updates both amounts on retry', async () => {
  const first = spendingSummary(saved);
  const loadSpending = jest
    .fn()
    .mockResolvedValueOnce(first)
    .mockRejectedValueOnce(new Error('Offline.'))
    .mockResolvedValueOnce({
      ...first,
      overall: { ...first.overall, remainingOere: 250000, weeklyGuideDkk: 1029 },
    });
  await render(
    <BudgetHomeScreen {...callbacks} load={async () => [saved]} loadSpending={loadSpending} />,
  );
  await fireEvent.press(await screen.findByRole('button', { name: 'Budget details' }));
  const details = () => within(screen.getByTestId('read-more-overlay'));
  await fireEvent.press(details().getByRole('button', { name: 'Refresh spending' }));
  expect(await details().findByText(/Spending refresh failed/)).toBeVisible();
  expect(details().getByText('2.800 kr.')).toBeVisible();
  expect(details().getByText('Demo data as of 2026-10-15')).toBeVisible();
  await fireEvent.press(details().getByRole('button', { name: 'Refresh spending' }));
  expect(await details().findByText('2.500 kr.')).toBeVisible();
  expect(details().getByText('About 1.029 kr. for the next 7 days')).toBeVisible();
  await fireEvent.press(details().getByRole('button', { name: 'Close' }));
  expect(screen.getByText('2.500 kr.')).toBeVisible();
  expect(screen.queryByText(/for the next/)).toBeNull();
});

it('replaces the spending figures when switching between independent budgets', async () => {
  const second = {
    ...saved,
    id: 'two',
    accountId: 'second-account',
    plan: { ...saved.plan, name: 'Household' },
  };
  const budgets = [saved, second];
  const load = async () => budgets;
  const loadSpending = async (id: string) => {
    const data = spendingSummary(id === saved.id ? saved : second);
    if (id === second.id)
      data.overall = { ...data.overall, remainingOere: 680000, weeklyGuideDkk: 2800 };
    return data;
  };
  const view = await render(
    <BudgetHomeScreen
      {...callbacks}
      selectedId={saved.id}
      load={load}
      loadSpending={loadSpending}
    />,
  );
  await screen.findByText('Left after bills and savings');
  await view.rerender(
    <BudgetHomeScreen
      {...callbacks}
      selectedId={second.id}
      load={load}
      loadSpending={loadSpending}
    />,
  );
  expect(await screen.findByText('6.800 kr.')).toBeVisible();
  expect(screen.queryByText(/for the next/)).toBeNull();
  expect(screen.queryByText('2.800 kr.')).toBeNull();
});
