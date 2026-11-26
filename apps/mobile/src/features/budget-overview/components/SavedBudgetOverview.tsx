import { isHistorical } from './budgetMonth';
import type { Budget } from '@budget-builder/contracts';
import type { ComponentRef, RefObject } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../foundation/components/AppText';
import { Button } from '../../../foundation/components/Button';
import { spacing } from '../../../foundation/theme/theme';
import type { SpendingState } from '../hooks/useSpendingSummary';
import { SavedBudgetHeading } from './SavedBudgetHeading';
import { SnapshotNotice } from './SnapshotNotice';

import { OverviewTransactions } from '../containers/OverviewTransactions';
import { SpendingProgress } from './SpendingProgress';
import { AllocationDashboard } from './AllocationDashboard';

export function SavedBudgetOverview({
  budget,
  headingFocusTarget,
  active = true,
  spending = { status: 'loading' },
  onRetrySpending,
  onOpenPot,
  onOpenActivity,
  onOpenUndated,
}: {
  budget: Budget;
  active?: boolean;
  headingFocusTarget?: RefObject<ComponentRef<typeof View> | null>;
  spending?: SpendingState;
  onRetrySpending?: (() => void) | undefined;
  onOpenPot?: ((budgetId: string, potId: string) => void) | undefined;
  onOpenUndated?: ((budgetId: string) => void) | undefined;
  onOpenActivity?: ((budgetId: string) => void) | undefined;
}) {
  const summary = spending.status === 'ready' ? spending.data : undefined;
  const historical = !!summary && isHistorical(summary);
  return (
    <View style={styles.content}>
      <View style={styles.dashboard}>
        <SavedBudgetHeading budget={budget} focusTarget={headingFocusTarget} />
        {spending.status === 'ready' ? (
          <>
            <SpendingProgress summary={spending.data} />
            {spending.error ? (
              <AppText accessibilityRole="alert">
                Spending refresh failed. Showing the last loaded snapshot. {spending.error}
              </AppText>
            ) : null}
          </>
        ) : spending.status === 'loading' ? (
          <AppText>Loading spending guidance…</AppText>
        ) : (
          <>
            <AppText accessibilityRole="alert">
              Spending unavailable. {spending.message} Your saved plan is still available.
            </AppText>
            {onRetrySpending ? (
              <Button label="Retry spending" variant="secondary" onPress={onRetrySpending} />
            ) : null}
          </>
        )}
        <AllocationDashboard
          budget={budget}
          summary={summary}
          historical={historical}
          onOpenPot={onOpenPot}
        />
      </View>
      {active && spending.status === 'ready' ? (
        <SnapshotNotice
          summary={spending.data}
          onOpenActivity={onOpenActivity && (() => onOpenActivity(budget.id))}
          onRefresh={onRetrySpending}
          refreshing={spending.refreshing}
          refreshError={spending.error}
        />
      ) : null}
      {summary?.undatedReviewCount ? (
        <Button
          label={`Review undated records (${summary.undatedReviewCount})`}
          variant="secondary"
          onPress={() => onOpenUndated?.(budget.id)}
        />
      ) : null}
      {summary ? (
        <OverviewTransactions
          key={summary.snapshotVersion}
          summary={summary}
          active={active}
          onRefreshSummary={onRetrySpending}
        />
      ) : (
        <View style={styles.content}>
          <AppText variant="heading" accessibilityRole="header">
            Account transactions
          </AppText>
          <AppText>
            {spending.status === 'loading' ? 'Loading transactions…' : 'Transactions unavailable.'}
          </AppText>
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  content: { gap: spacing.medium },
  dashboard: { gap: spacing.medium },
});
