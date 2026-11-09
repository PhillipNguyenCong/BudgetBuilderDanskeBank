import type { Budget } from '@budget-builder/contracts';
import { AppText } from '../../../foundation/components/AppText';
import { Button } from '../../../foundation/components/Button';

export function SaveRecoveryFeedback({
  error,
  needsCheck,
  checking,
  checkMessage,
  existing,
  onCheck,
  onOpenExisting,
}: {
  error?: string;
  needsCheck: boolean;
  checking: boolean;
  checkMessage?: string;
  existing?: Budget;
  onCheck: () => void;
  onOpenExisting: (budget: Budget) => void;
}) {
  return (
    <>
      {error ? <AppText accessibilityRole="alert">{error}</AppText> : null}
      {needsCheck ? (
        <Button
          label={checking ? 'Checking saved budgets…' : 'Check saved budgets'}
          disabled={checking}
          onPress={() => void onCheck()}
        />
      ) : null}
      {checkMessage ? <AppText accessibilityLiveRegion="polite">{checkMessage}</AppText> : null}
      {existing ? (
        <Button label="Open saved budget" onPress={() => onOpenExisting(existing!)} />
      ) : null}
    </>
  );
}
