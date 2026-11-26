import { plannedWeeklyDkk } from '@budget-builder/budget-core/allocations';
import type { Budget, SpendingSummary } from '@budget-builder/contracts';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { AppText } from '../../../foundation/components/AppText';
import { colors, spacing } from '../../../foundation/theme/theme';
import { formatDkk, WidgetIcon, widgetColor } from '../../budget-shared';
import { formatGuideDkk } from './SpendingFigures';

export function AllocationDashboard({
  budget,
  summary,
  historical,
  onOpenPot,
}: {
  budget: Budget;
  summary: SpendingSummary | undefined;
  historical: boolean;
  onOpenPot: ((budgetId: string, potId: string) => void) | undefined;
}) {
  const { fontScale, width } = useWindowDimensions();
  const { incomeOere, unallocatedOere } = budget.totals;
  const pots = budget.plan.pots.map((pot) => ({
    ...pot,
    purpose: pot.type === 'SPENDING' ? pot.purpose : undefined,
    amount: budget.totals.pots.find(({ id }) => id === pot.id)?.allocationOere,
  }));
  const income = {
    ...budget.plan.income,
    type: 'INCOME' as const,
    amount: incomeOere,
    purpose: undefined,
  };
  const twoColumns = width >= 320 && fontScale <= 1.25;

  function renderCard({ id, name, type, amount, purpose }: (typeof pots)[number] | typeof income) {
    const spending = type === 'SPENDING';
    const compact = type === 'INCOME' || type === 'FIXED_EXPENSE';
    const palette = widgetColor(type, purpose);
    const value = amount === undefined ? 'Amount unavailable' : formatDkk(amount);
    const weeklyPlan =
      purpose !== undefined && summary && !historical && amount !== undefined
        ? formatGuideDkk(plannedWeeklyDkk(amount, summary.month))
        : undefined;
    return (
      <Pressable
        key={id}
        accessibilityRole="button"
        accessibilityLabel={`View ${name} details`}
        accessibilityValue={{
          text: [weeklyPlan && `Weekly plan, about ${weeklyPlan}`, `${value}, planned per month`]
            .filter(Boolean)
            .join('. '),
        }}
        onPress={() => onOpenPot?.(budget.id, id)}
        style={({ pressed }) => [
          styles.row,
          spending && styles.spending,
          compact && twoColumns && styles.compact,
          { backgroundColor: palette.background, opacity: pressed ? 0.75 : 1 },
        ]}
      >
        <WidgetIcon type={type} purpose={purpose} />
        <View
          style={[
            styles.rowContent,
            fontScale > 1.25 && styles.stacked,
            spending && styles.spendingContent,
            compact && twoColumns && styles.compactContent,
          ]}
        >
          <AppText variant="label">{name}</AppText>
          <AppText variant={spending ? 'heading' : 'label'} style={styles.value}>
            {weeklyPlan ? `≈ ${weeklyPlan}/week` : value}
          </AppText>
          {weeklyPlan ? (
            <AppText variant="small" style={styles.secondary}>
              Monthly plan · {value}
            </AppText>
          ) : null}
        </View>
      </Pressable>
    );
  }

  return (
    <View style={styles.stack}>
      {pots.filter(({ type }) => type === 'SPENDING').map(renderCard)}
      <View style={twoColumns ? styles.columns : styles.stack}>
        {renderCard(income)}
        {pots.filter(({ type }) => type === 'FIXED_EXPENSE').map(renderCard)}
      </View>
      {pots.filter(({ type }) => type === 'SAVINGS').map(renderCard)}
      {unallocatedOere > 0 ? (
        <AppText variant="small">Unallocated · {formatDkk(unallocatedOere)}</AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing.medium },
  columns: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.medium },
  compact: {
    flexBasis: '46%',
    flexGrow: 1,
    maxWidth: '49%',
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: spacing.medium,
    gap: spacing.small,
  },
  compactContent: {
    flex: 0,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 0,
  },
  spending: { padding: spacing.large, alignItems: 'flex-start', gap: spacing.medium },
  spendingContent: { flexDirection: 'column', alignItems: 'flex-start', gap: spacing.small },
  secondary: { color: colors.muted },
  row: {
    minHeight: 56,
    borderRadius: 20,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  stacked: { flexDirection: 'column', alignItems: 'flex-start' },
  value: {
    fontVariant: ['tabular-nums'],
  },
});
