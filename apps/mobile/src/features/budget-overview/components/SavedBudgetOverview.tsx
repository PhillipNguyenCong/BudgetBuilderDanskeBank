import type { Budget } from '@budget-builder/contracts';
import type { ComponentRef, RefObject } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../foundation/components/AppText';
import { Button } from '../../../foundation/components/Button';
import { spacing } from '../../../foundation/theme/theme';
import { typeLabels } from '../../budget-shared';
import type { SpendingState } from '../hooks/useSpendingSummary';
import { ForecastUnavailableNotice } from './ForecastUnavailableNotice';
import { SavedBudgetHeading } from './SavedBudgetHeading';
import { SavedBudgetTotals } from './SavedBudgetTotals';
import { SavedPotCard, type SavedWidget } from './SavedPotCard';
import { SpendingFigures } from './SpendingFigures';
import { SnapshotNotice } from './SnapshotNotice';
import { ActivityList } from './ActivityList';

export function SavedBudgetOverview({
  budget,
  headingFocusTarget,
  spending = { status: 'loading' },
  onRetrySpending,
  onOpenPot,
  onOpenActivity,
}: {
  budget: Budget;
  headingFocusTarget?: RefObject<ComponentRef<typeof View> | null>;
  spending?: SpendingState;
  onRetrySpending?: (() => void) | undefined;
  onOpenPot?: ((budgetId: string, potId: string) => void) | undefined;
  onOpenActivity?: ((budgetId: string) => void) | undefined;
}) {
  const summary = spending.status === 'ready' ? spending.data : undefined;
  const groups: { type: SavedWidget['type']; widgets: SavedWidget[] }[] = [
    ...(['SPENDING', 'FIXED_EXPENSE', 'SAVINGS'] as const).map((type) => ({
      type,
      widgets: budget.plan.pots.filter((pot) => pot.type === type),
    })),
    { type: 'INCOME', widgets: [{ ...budget.plan.income, type: 'INCOME' }] },
  ];
  return (
    <View style={styles.content}>
      <SavedBudgetHeading budget={budget} focusTarget={headingFocusTarget} />
      {summary ? (
        <>
          <SnapshotNotice summary={summary} />
          {spending.status === 'ready' && spending.refreshing ? (
            <AppText>Refreshing spending…</AppText>
          ) : null}
          {spending.status === 'ready' && spending.error ? (
            <AppText accessibilityRole="alert">
              Spending refresh failed. Showing the last loaded snapshot. {spending.error}
            </AppText>
          ) : null}
          <SpendingFigures numbers={summary.overall} daysRemaining={summary.daysRemaining} />
        </>
      ) : spending.status === 'loading' ? (
        <AppText>Loading spending guidance…</AppText>
      ) : (
        <>
          <AppText accessibilityRole="alert">
            Spending unavailable.{' '}
            {spending.status === 'error' ? spending.message : 'Refresh spending to try again.'} Your
            saved plan is still available.
          </AppText>
        </>
      )}
      {onRetrySpending &&
      (spending.status === 'error' || (spending.status === 'ready' && spending.error)) ? (
        <Button label="Retry spending" variant="secondary" onPress={onRetrySpending} />
      ) : null}
      {groups
        .filter((group) => group.widgets.length)
        .map((group) => (
          <View key={group.type} style={styles.group}>
            <AppText variant="heading" accessibilityRole="header">
              {typeLabels[group.type]}
            </AppText>
            {group.widgets.map((widget) => (
              <SavedPotCard
                key={widget.id}
                widget={widget}
                allocationOere={
                  widget.type === 'INCOME'
                    ? budget.totals.incomeOere
                    : budget.totals.pots.find((pot) => pot.id === widget.id)?.allocationOere
                }
                numbers={
                  widget.type === 'SPENDING'
                    ? summary?.pots.find((pot) => pot.potId === widget.id)?.numbers
                    : widget.type === 'FIXED_EXPENSE'
                      ? summary?.fixedExpenses.find((pot) => pot.potId === widget.id)?.numbers
                      : undefined
                }
                guideDays={Math.min(7, summary?.daysRemaining ?? 7)}
                onOpen={() => onOpenPot?.(budget.id, widget.id)}
              />
            ))}
          </View>
        ))}
      {summary ? (
        <View style={styles.group}>
          <AppText variant="heading" accessibilityRole="header">
            Recent spending
          </AppText>
          <ActivityList items={summary.recent} budget={budget} />
        </View>
      ) : null}
      <Button
        label="All account activity"
        variant="secondary"
        onPress={() => onOpenActivity?.(budget.id)}
      />
      <AppText variant="heading" accessibilityRole="header">
        Monthly plan totals
      </AppText>
      <SavedBudgetTotals totals={budget.totals} />
      <AppText variant="small">
        Pots divide the money in your account. No bank transfer is made. Planned allocations are
        separate from recorded spending.
      </AppText>
      <ForecastUnavailableNotice />
    </View>
  );
}
const styles = StyleSheet.create({
  content: { gap: spacing.screen },
  group: { gap: spacing.medium },
});
