import { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { Screen } from '../../../foundation/components/Screen';
import { AppText } from '../../../foundation/components/AppText';
import { Button } from '../../../foundation/components/Button';
import { AccountOption } from '../components/AccountOption';
import { loadAccountSelection, type AccountSelectionData } from '../api/accounts';
type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: AccountSelectionData };
export function AccountSelectionScreen({
  onBack,
  load = loadAccountSelection,
}: {
  onBack: () => void;
  load?: typeof loadAccountSelection;
}) {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading' });
    setSelectedId(null);
    load(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setState({ status: 'ready', data });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setState({
            status: 'error',
            message: error instanceof Error ? error.message : 'Could not load your accounts.',
          });
      });
    return () => controller.abort();
  }, [attempt, load]);
  return (
    <Screen>
      <Button label="Back" onPress={onBack} />
      <AppText variant="title" accessibilityRole="header">
        Select an account
      </AppText>
      <AppText>Choose one account for your budget.</AppText>
      {state.status === 'loading' ? (
        <>
          <ActivityIndicator accessibilityLabel="Loading accounts" />
          <AppText accessibilityLiveRegion="polite">Loading your accounts…</AppText>
        </>
      ) : state.status === 'error' ? (
        <>
          <AppText accessibilityRole="alert">{state.message}</AppText>
          <Button label="Try again" onPress={() => setAttempt((value) => value + 1)} />
        </>
      ) : (
        <>
          {state.data.user.displayName ? (
            <AppText variant="label">Accounts for {state.data.user.displayName}</AppText>
          ) : null}
          <AppText variant="small">
            Available history: {state.data.accounts.quality.coverage.from ?? 'Unknown start'} to{' '}
            {state.data.accounts.quality.coverage.to ?? 'unknown end'} (
            {state.data.accounts.quality.coverage.completeMonths} complete months).
          </AppText>
          {state.data.accounts.quality.issues.length > 0 ? (
            <AppText variant="small">
              Some source data is incomplete or uncertain. Available history may contain gaps.
            </AppText>
          ) : null}
          {state.data.accounts.items.length === 0 ? (
            <>
              <AppText variant="heading">No accounts available</AppText>
              <AppText>No accounts were returned for this demo user.</AppText>
              <Button label="Try again" onPress={() => setAttempt((value) => value + 1)} />
            </>
          ) : (
            <>
              {state.data.accounts.items.every((account) =>
                state.data.usedAccountIds.includes(account.id),
              ) ? (
                <AppText>All your accounts already have a budget.</AppText>
              ) : null}
              {state.data.accounts.items.map((account) => (
                <AccountOption
                  key={account.id}
                  account={account}
                  selected={selectedId === account.id}
                  unavailable={state.data.usedAccountIds.includes(account.id)}
                  onSelect={() => setSelectedId(account.id)}
                />
              ))}
              {selectedId ? (
                <AppText accessibilityLiveRegion="polite">
                  Account selected. No budget has been created.
                </AppText>
              ) : null}
              <Button
                label="Continue"
                disabled
                accessibilityHint="The budget editor is not available in this demo yet."
              />
              <AppText variant="small">
                The budget editor is coming next. You can try account selection now.
              </AppText>
            </>
          )}
        </>
      )}
    </Screen>
  );
}
