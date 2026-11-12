import type { SpendingSummary } from '@budget-builder/contracts';
import { AppText } from '../../../foundation/components/AppText';
export function SnapshotNotice({ summary }: { summary: SpendingSummary }) {
  return (
    <>
      <AppText variant="label">
        {summary.account.name}
        {summary.account.maskedIdentifier ? ` · ${summary.account.maskedIdentifier}` : ''}
      </AppText>
      <AppText>Demo snapshot · {summary.snapshotDate}</AppText>
      <AppText variant="small">
        Source coverage: {summary.quality.coverage.from ?? 'unknown start'} to{' '}
        {summary.quality.coverage.to ?? 'unknown end'}.
      </AppText>
      <AppText variant="small">
        Current plan applied to {summary.month}. Zero opening carry-in is configured for this
        demonstration; rollover has not been applied. Source data refreshes only when the backend
        restarts.
      </AppText>
      {summary.defaultSpendingPotId ? (
        <AppText variant="small">
          Unmatched spending defaults to{' '}
          {summary.budget.plan.pots.find((p) => p.id === summary.defaultSpendingPotId)?.name}.
          Automatic classifications can be corrected.
        </AppText>
      ) : null}
      {summary.reviewCount > 0 ? (
        <AppText accessibilityRole="alert">
          {summary.reviewCount} transactions need review. Open account activity to see uncertain
          records.
        </AppText>
      ) : null}
      {summary.retainedCorrectionCount > 0 ? (
        <AppText>
          {summary.retainedCorrectionCount} earlier corrections are retained for source records that
          changed or are no longer present.
        </AppText>
      ) : null}
    </>
  );
}
