import { fireEvent, render, screen } from '@testing-library/react-native';
import { activityItem, spendingSummary } from '../../../tests/spendingFixtures';
import * as api from '../api';
import { BudgetActivityScreen } from './BudgetActivityScreen';
it('US-06: pot breakdown and linked transactions refresh after a correction', async () => {
  let corrected = false;
  const initial = spendingSummary();
  const loadSummary = jest.fn(async () =>
    corrected
      ? {
          ...initial,
          pots: initial.pots.map((p) => ({
            ...p,
            numbers: {
              ...p.numbers,
              recordedSpendingOere: 470000,
              remainingOere: 330000,
              weeklyGuideDkk: 1359,
              dailyGuideDkk: 194,
            },
          })),
        }
      : initial,
  );
  const loadActivity = jest.fn(async () => ({
    budgetRevision: 1,
    snapshotVersion: 'a'.repeat(64),
    snapshotDate: '2026-10-15',
    items: [activityItem()],
    page: { limit: 25, offset: 0, total: 1, hasMore: false },
  }));
  const save = jest.spyOn(api, 'correctBudgetTransaction').mockImplementation(async () => {
    corrected = true;
    return {
      transactionId: 'shop',
      revision: 1,
      decision: { kind: 'TRANSFER', potId: null },
      updatedAt: '2026-10-15T12:00:00Z',
    };
  });
  try {
    await render(
      <BudgetActivityScreen
        budgetId="saved"
        potId="spending"
        onBack={jest.fn()}
        onOpenActivity={jest.fn()}
        loadSummary={loadSummary}
        loadActivity={loadActivity}
      />,
    );
    expect(await screen.findByText('Booked: DKK 5,200')).toBeVisible();
    await fireEvent.press(
      await screen.findByRole('button', { name: 'View Synthetic grocery shop classification' }),
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Transfer · exclude from spending' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Save classification' }));
    expect(await screen.findByText('DKK 3,300')).toBeVisible();
    expect(screen.getByText('Booked: DKK 4,700')).toBeVisible();
    expect(loadActivity.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByRole('button', { name: 'Save classification' })).toBeNull();
  } finally {
    save.mockRestore();
  }
});
