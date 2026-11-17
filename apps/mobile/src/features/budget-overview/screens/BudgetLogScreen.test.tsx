import { fireEvent, render, screen } from '@testing-library/react-native';
import { BudgetLogScreen } from './BudgetLogScreen';
import { spendingSummary } from '../../../tests/spendingFixtures';
it('US-12: lists active months vertically, newest first, and opens the selected overview', async () => {
  const summary = spendingSummary();
  summary.budget.createdAt = '2026-09-01T12:00:00Z';
  summary.startMonth = '2026-09';
  summary.currentMonth = '2026-11';
  summary.month = '2026-11';
  summary.sourceSnapshotDate = '2026-09-03';
  summary.availableMonths = ['2026-08', '2026-09', '2026-10', '2026-11'];
  const onOpenMonth = jest.fn();
  await render(
    <BudgetLogScreen
      budgetId="saved"
      onBack={jest.fn()}
      onOpenMonth={onOpenMonth}
      load={async () => summary}
    />,
  );
  expect(await screen.findByText('Active since September 2026')).toBeVisible();
  expect(screen.queryByRole('button', { name: 'View August 2026 budget' })).toBeNull();
  expect(screen.getAllByRole('button').map((button) => button.props.accessibilityLabel)).toEqual([
    'Back',
    'View November 2026 budget',
    'View October 2026 budget',
    'View September 2026 budget',
  ]);
  await fireEvent.press(screen.getByRole('button', { name: 'View October 2026 budget' }));
  expect(onOpenMonth).toHaveBeenCalledWith('2026-10');
});
it('US-10: a failed log request offers retry without a false month list', async () => {
  const load = jest
    .fn()
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce({
      ...spendingSummary(),
      startMonth: '2026-10',
      currentMonth: '2026-10',
      availableMonths: ['2026-10'],
    });
  await render(
    <BudgetLogScreen budgetId="saved" onBack={jest.fn()} onOpenMonth={jest.fn()} load={load} />,
  );
  expect(await screen.findByText('Could not load budget log. offline')).toBeVisible();
  expect(screen.queryByRole('button', { name: /View .* budget/ })).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByRole('button', { name: 'View October 2026 budget' })).toBeVisible();
});
