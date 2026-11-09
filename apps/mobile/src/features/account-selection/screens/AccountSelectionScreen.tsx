import { AppText } from '../../../foundation/components/AppText';
import { Button } from '../../../foundation/components/Button';
import { Screen } from '../../../foundation/components/Screen';
import { loadAccountSelection } from '../api/accounts';
import { AccountSelectionReady } from '../components/AccountSelectionReady';
import { AccountsError } from '../components/AccountsError';
import { AccountsLoading } from '../components/AccountsLoading';
import { useAccountSelection } from '../hooks/useAccountSelection';
export function AccountSelectionScreen({
  onBack,
  onContinue,
  load = loadAccountSelection,
}: {
  onBack: () => void;
  onContinue: (accountId: string) => void;
  load?: typeof loadAccountSelection;
}) {
  const { state, selectedId, setSelectedId, retry } = useAccountSelection(load);
  return (
    <Screen>
      <Button label="Back" onPress={onBack} />
      <AppText variant="title" accessibilityRole="header">
        Select an account
      </AppText>
      <AppText>Choose one account for your budget.</AppText>
      {state.status === 'loading' ? (
        <AccountsLoading />
      ) : state.status === 'error' ? (
        <AccountsError message={state.message} onRetry={retry} />
      ) : (
        <AccountSelectionReady
          data={state.data}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onContinue={onContinue}
          onRetry={retry}
        />
      )}
    </Screen>
  );
}
