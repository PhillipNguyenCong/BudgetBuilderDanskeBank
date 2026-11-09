import { render, screen, fireEvent } from '@testing-library/react-native';
import { AccountSelectionScreen } from './AccountSelectionScreen';
import type { AccountSelectionData } from '../api/accounts';
const data: AccountSelectionData = {
  user: { id: 'demo-user', displayName: 'Demo Customer', isDemo: true },
  accounts: {
    items: [
      {
        id: 'available',
        name: 'Everyday',
        currency: 'DKK',
        maskedIdentifier: '••1234',
        availableBalanceOere: null,
        bookedBalanceOere: null,
        updatedAt: null,
        issues: [],
      },
      {
        id: 'used',
        name: 'Other account',
        currency: 'DKK',
        maskedIdentifier: '••5678',
        availableBalanceOere: 10000,
        bookedBalanceOere: null,
        updatedAt: null,
        issues: [],
      },
    ],
    quality: {
      asOf: '2026-09-03T12:00:00Z',
      coverage: { from: '2026-07-01', to: '2026-09-03', completeMonths: 2 },
      duplicatesRemoved: 0,
      issues: [],
    },
  },
  usedAccountIds: ['used'],
};
it('selects one eligible account and disables accounts with budgets', async () => {
  await render(
    <AccountSelectionScreen onContinue={jest.fn()} load={async () => data} onBack={jest.fn()} />,
  );
  const available = await screen.findByRole('radio', { name: 'Everyday, ••1234' });
  expect(screen.getByText('Available balance unknown')).toBeVisible();
  expect(screen.getByText(/2 complete months/)).toBeVisible();
  const used = screen.getByRole('radio', { name: 'Other account, ••5678' });
  expect(used).toBeDisabled();
  await fireEvent.press(available);
  expect(available).toBeChecked();
  await fireEvent.press(used);
  expect(available).toBeChecked();
  expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled();
});
it('shows errors and retries instead of showing a false empty list', async () => {
  const load = jest
    .fn()
    .mockRejectedValueOnce(new Error('Could not load accounts.'))
    .mockResolvedValueOnce(data);
  await render(<AccountSelectionScreen onContinue={jest.fn()} load={load} onBack={jest.fn()} />);
  await screen.findByText('Could not load accounts.');
  await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByText('Everyday')).toBeVisible();
  expect(load).toHaveBeenCalledTimes(2);
});
it('shows loading then an explicit empty state', async () => {
  let resolve!: (value: AccountSelectionData) => void;
  const pending = new Promise<AccountSelectionData>((r) => {
    resolve = r;
  });
  await render(
    <AccountSelectionScreen onContinue={jest.fn()} load={() => pending} onBack={jest.fn()} />,
  );
  expect(screen.getByText('Loading your accounts…')).toBeVisible();
  resolve({ ...data, accounts: { ...data.accounts, items: [] } });
  expect(await screen.findByText('No accounts available')).toBeVisible();
});

it('explains when every account is already allocated and supports back', async () => {
  const onBack = jest.fn();
  await render(
    <AccountSelectionScreen
      onContinue={jest.fn()}
      load={async () => ({ ...data, usedAccountIds: ['available', 'used'] })}
      onBack={onBack}
    />,
  );
  expect(await screen.findByText('All your accounts already have a budget.')).toBeVisible();
  expect(screen.getAllByRole('radio').every((item) => item.props.accessibilityState.disabled)).toBe(
    true,
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
  expect(onBack).toHaveBeenCalledTimes(1);
});

it('cancels requests when the screen unmounts', async () => {
  let signal: AbortSignal | undefined;
  const view = await render(
    <AccountSelectionScreen
      onContinue={jest.fn()}
      onBack={jest.fn()}
      load={(value) => {
        signal = value;
        return new Promise(() => {});
      }}
    />,
  );
  expect(signal?.aborted).toBe(false);
  await view.unmount();
  expect(signal?.aborted).toBe(true);
});
