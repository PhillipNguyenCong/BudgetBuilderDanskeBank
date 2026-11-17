import { Pressable, StyleSheet, View } from 'react-native';
import { Screen } from '../../../foundation/components/Screen';
import { BackButton } from '../../../foundation/components/BackButton';
import { AppText } from '../../../foundation/components/AppText';
import { Button } from '../../../foundation/components/Button';
import { colors, spacing } from '../../../foundation/theme/theme';
import { getSpendingSummary } from '../api';
import { useSpendingSummary } from '../hooks/useSpendingSummary';
import { creationMonth, monthLabel } from '../components/budgetMonth';
export function BudgetLogScreen({
  budgetId,
  active = true,
  onBack,
  onOpenMonth,
  load = getSpendingSummary,
}: {
  budgetId: string;
  active?: boolean;
  onBack: () => void;
  onOpenMonth: (month: string) => void;
  load?: typeof getSpendingSummary;
}) {
  const result = useSpendingSummary(budgetId || undefined, undefined, active, load);
  const summary = result.state.status === 'ready' ? result.state.data : undefined;
  const start = summary ? (summary.startMonth ?? creationMonth(summary.budget.createdAt)) : '';
  const current = summary?.currentMonth ?? summary?.availableMonths?.at(-1) ?? summary?.month;
  const months = summary
    ? [...(summary.availableMonths ?? [summary.month])]
        .filter((month) => month >= start && (!current || month <= current))
        .sort()
        .reverse()
    : [];
  return (
    <Screen>
      <BackButton onPress={onBack} />
      <AppText variant="title" accessibilityRole="header">
        Budget log
      </AppText>
      {summary ? <AppText variant="label">{summary.budget.plan.name}</AppText> : null}
      {!budgetId ? (
        <AppText accessibilityRole="alert">Select a saved budget to open its log.</AppText>
      ) : result.state.status === 'loading' ? (
        <AppText>Loading budget log…</AppText>
      ) : null}
      {result.state.status === 'error' ? (
        <>
          <AppText accessibilityRole="alert">
            Could not load budget log. {result.state.message}
          </AppText>
          <Button label="Try again" onPress={result.retry} />
        </>
      ) : null}
      {summary ? (
        <>
          <AppText variant="small">Active since {monthLabel(start)}</AppText>
          {result.state.status === 'ready' && result.state.error ? (
            <>
              <AppText accessibilityRole="alert">
                Could not refresh the log. Showing the last loaded months.
              </AppText>
              <Button label="Retry budget log" variant="secondary" onPress={result.retry} />
            </>
          ) : null}
          {!months.length ? <AppText>No active months are available yet.</AppText> : null}
          <View style={styles.list}>
            {months.map((month) => (
              <Pressable
                key={month}
                accessibilityRole="button"
                accessibilityLabel={`View ${monthLabel(month)} budget`}
                onPress={() => onOpenMonth(month)}
                style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
              >
                <AppText variant="heading">{monthLabel(month)}</AppText>
                {month === current ? <AppText variant="small">Current month</AppText> : null}
                {summary.sourceSnapshotDate && month > summary.sourceSnapshotDate.slice(0, 7) ? (
                  <AppText variant="small">Awaiting source data</AppText>
                ) : null}
                <AppText variant="small" style={styles.link}>
                  View overview
                </AppText>
              </Pressable>
            ))}
          </View>
        </>
      ) : null}
    </Screen>
  );
}
const styles = StyleSheet.create({
  list: { gap: spacing.medium },
  row: {
    minHeight: 44,
    padding: spacing.large,
    gap: spacing.small,
    borderRadius: 16,
    backgroundColor: colors.white,
  },
  link: { color: colors.blue },
});
