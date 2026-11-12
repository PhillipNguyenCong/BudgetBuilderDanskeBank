import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { ApiError } from '../../../lib/api';
import { activityItem, savedBudget } from '../../../tests/spendingFixtures';
import { TransactionCorrection } from './TransactionCorrection';
const callbacks = { onClose: jest.fn(), onSaved: jest.fn(), onRestoreFocus: jest.fn() };
beforeEach(() => jest.clearAllMocks());
it('US-06: saves only an explicitly accepted correction and blocks duplicate/pending actions', async () => {
  let finish!: () => void;
  const save = jest.fn(
    () =>
      new Promise<
        Awaited<ReturnType<NonNullable<Parameters<typeof TransactionCorrection>[0]['save']>>>
      >((resolve) => {
        finish = () =>
          resolve({
            transactionId: 'shop',
            revision: 1,
            decision: { kind: 'TRANSFER', potId: null },
            updatedAt: '2026-10-15T12:00:00Z',
          });
      }),
  );
  await render(
    <TransactionCorrection
      budget={savedBudget()}
      initial={activityItem()}
      {...callbacks}
      save={save}
    />,
  );
  expect(save).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Transfer · exclude from spending' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Save classification' }));
  expect(save).toHaveBeenCalledWith('saved', 'shop', 0, 1, { kind: 'TRANSFER', potId: null });
  expect(screen.getByRole('button', { name: 'Close' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
  await act(() => finish());
  expect(callbacks.onSaved).toHaveBeenCalledTimes(1);
});
it.each([
  new ApiError('CORRECTION_CONFLICT', 'Classification changed.', 409),
  new ApiError('SAVE_UNCONFIRMED', 'Could not confirm the write.', undefined, true),
])(
  'US-10: stale or uncertain writes retain the choice and require a read before retry',
  async (failure) => {
    const save = jest.fn().mockRejectedValueOnce(failure);
    const reload = jest.fn(async () => ({
      ...activityItem(),
      correctionRevision: 1,
      origin: 'CUSTOMER' as const,
      kind: 'TRANSFER' as const,
      potId: null,
    }));
    await render(
      <TransactionCorrection
        budget={savedBudget()}
        initial={activityItem()}
        {...callbacks}
        save={save}
        reload={reload}
      />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Transfer · exclude from spending' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Save classification' }));
    expect(screen.getByText(failure.message)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Save classification' })).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Selected · Transfer · exclude from spending' }),
    ).toBeVisible();
    await fireEvent.press(
      screen.getByRole('button', { name: 'Reload latest classification (discard unsaved choice)' }),
    );
    expect(reload).toHaveBeenCalledWith('saved', 'shop');
    expect(screen.getByRole('button', { name: 'Save classification' })).toBeEnabled();
    expect(callbacks.onSaved).not.toHaveBeenCalled();
  },
);
