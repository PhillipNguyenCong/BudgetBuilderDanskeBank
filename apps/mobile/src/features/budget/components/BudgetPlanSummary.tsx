import { AppText } from '../../../foundation/components/AppText';
import { Button } from '../../../foundation/components/Button';
import { Card } from '../../../foundation/components/Card';
import { formatDkk, type validateDraft } from '../editor/draft';

export function BudgetPlanSummary({
  result,
  onUpdateSavings,
}: {
  result: ReturnType<typeof validateDraft>;
  onUpdateSavings: () => void;
}) {
  return (
    <Card>
      <AppText variant="heading" accessibilityRole="header">
        Monthly plan
      </AppText>
      {result.totals ? (
        <>
          <AppText>Income: {formatDkk(result.totals.incomeOere)}</AppText>
          <AppText>Allocated: {formatDkk(result.totals.allocatedOere)}</AppText>
          <AppText accessibilityLiveRegion="polite">
            Unallocated: {formatDkk(result.totals.unallocatedOere)}
          </AppText>
        </>
      ) : (
        <AppText>Totals unavailable until the inputs are valid.</AppText>
      )}
      {result.error ? <AppText accessibilityRole="alert">{result.error}</AppText> : null}
      <Button
        label="Update savings"
        variant="secondary"
        disabled={!result.plan || !result.totals}
        onPress={onUpdateSavings}
      />
    </Card>
  );
}
