import { AppText } from '../../../foundation/components/AppText';
import { Button } from '../../../foundation/components/Button';
export function BudgetsError({
  onRetry,
  onPreview,
}: {
  onRetry: () => void;
  onPreview: () => void;
}) {
  return (
    <>
      <AppText accessibilityRole="alert">
        Could not load your saved budgets. No saved plans have been changed.
      </AppText>
      <Button label="Try again" onPress={onRetry} />
      <Button label="Preview sample widgets" variant="secondary" onPress={onPreview} />
    </>
  );
}
