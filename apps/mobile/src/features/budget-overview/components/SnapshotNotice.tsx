import { isHistorical } from './budgetMonth';
import { View } from 'react-native';
import { spacing } from '../../../foundation/theme/theme';
import { ReadMore } from '../../../foundation/components/ReadMore';
import type { SpendingSummary } from '@budget-builder/contracts';
import { AppText } from '../../../foundation/components/AppText';
export function SnapshotNotice({ summary }: { summary: SpendingSummary }) {
  return (
    <View style={{ gap: spacing.small }}>
      <AppText variant="label">
        {summary.account.name}
        {summary.account.maskedIdentifier ? ` · ${summary.account.maskedIdentifier}` : ''}
      </AppText>
      <AppText>Demo snapshot · {summary.sourceSnapshotDate ?? summary.snapshotDate}</AppText>
      {isHistorical(summary) ? (
        <AppText variant="small">Historical view · Current plan applied</AppText>
      ) : null}
      {summary.reviewCount > 0 ? (
        <AppText accessibilityRole="alert">
          {summary.reviewCount}{' '}
          {summary.reviewCount === 1 ? 'transaction needs' : 'transactions need'} review. Open
          account activity to see uncertain records.
        </AppText>
      ) : null}
      <ReadMore title="About this budget">
        <AppText variant="small">
          Source coverage: {summary.quality.coverage.from ?? 'unknown start'} to{' '}
          {summary.quality.coverage.to ?? 'unknown end'}.
        </AppText>
        <AppText variant="small">
          Current plan applied to {summary.month}; this is a reconstructed view, not a closed
          monthly result. Zero opening carry-in is configured for this demonstration; rollover has
          not been applied. Source data refreshes only when the backend restarts.
        </AppText>
        {summary.defaultSpendingPotId ? (
          <AppText variant="small">
            Unmatched spending defaults to{' '}
            {summary.budget.plan.pots.find((p) => p.id === summary.defaultSpendingPotId)?.name}.
            Automatic classifications can be corrected.
          </AppText>
        ) : null}
        <AppText>
          Pots divide your account money without making transfers. Planned allocations and spending
          guidance are not bank balances or card limits.
        </AppText>
        <AppText>
          Remaining = allocation + carried in − booked − pending − unconfirmed. Confirmed refunds
          restore the selected pot.
        </AppText>
        <AppText>
          Bill amounts are per payment; monthly equivalents are planning allocations, not additional
          payments. Payment scheduling, cash-flow forecasts, accumulated balances and month-end
          processing are not available yet.
        </AppText>
        <AppText>Last saved: {summary.budget.updatedAt.slice(0, 10)}</AppText>
        {summary.retainedCorrectionCount > 0 ? (
          <AppText>
            {summary.retainedCorrectionCount} earlier corrections are retained for source records
            that changed or are no longer present.
          </AppText>
        ) : null}
      </ReadMore>
    </View>
  );
}
