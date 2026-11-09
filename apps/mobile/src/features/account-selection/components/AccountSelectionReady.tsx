import { AppText } from '../../../foundation/components/AppText';
import { Button } from '../../../foundation/components/Button';
import { type AccountSelectionData } from '../api/accounts';
import { AccountHistory } from './AccountHistory';
import { AccountOption } from './AccountOption';
import { AccountsEmpty } from './AccountsEmpty';

export function AccountSelectionReady({
  data,
  selectedId,
  onSelect,
  onContinue,
  onRetry,
}: {
  data: AccountSelectionData;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onContinue: (id: string) => void;
  onRetry: () => void;
}) {
  return (
    <>
      {data.user.displayName ? (
        <AppText variant="label">Accounts for {data.user.displayName}</AppText>
      ) : null}
      <AccountHistory quality={data.accounts.quality} />
      {data.accounts.items.length === 0 ? (
        <AccountsEmpty onRetry={onRetry} />
      ) : (
        <>
          {data.accounts.items.every((account) => data.usedAccountIds.includes(account.id)) ? (
            <AppText>All your accounts already have a budget.</AppText>
          ) : null}
          {data.accounts.items.map((account) => (
            <AccountOption
              key={account.id}
              account={account}
              selected={selectedId === account.id}
              unavailable={data.usedAccountIds.includes(account.id)}
              onSelect={() => onSelect(account.id)}
            />
          ))}
          {selectedId ? (
            <AppText accessibilityLiveRegion="polite">
              Account selected. No budget has been created.
            </AppText>
          ) : null}
          <Button
            label="Continue"
            disabled={!selectedId || data.usedAccountIds.includes(selectedId)}
            onPress={() => {
              if (selectedId && !data.usedAccountIds.includes(selectedId)) onContinue(selectedId);
            }}
            accessibilityHint="Open manual budget setup for the selected account."
          />
          <AppText variant="small">
            Next, enter and review your monthly plan before creating your budget.
          </AppText>
        </>
      )}
    </>
  );
}
