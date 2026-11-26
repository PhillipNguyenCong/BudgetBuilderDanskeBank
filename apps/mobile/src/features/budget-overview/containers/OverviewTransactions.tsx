import type { SpendingSummary } from '@budget-builder/contracts';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../foundation/components/AppText';
import { Button } from '../../../foundation/components/Button';
import { colors, spacing } from '../../../foundation/theme/theme';
import { isHistorical, monthLabel } from '../components/budgetMonth';
import { useBudgetActivity } from '../hooks/useBudgetActivity';
import { transactionAmount } from '../components/ActivityList';

export function OverviewTransactions({
  summary,
  active,
  onRefreshSummary,
}: {
  summary: SpendingSummary;
  active: boolean;
  onRefreshSummary?: (() => void) | undefined;
}) {
  const historical = isHistorical(summary);
  const activity = useBudgetActivity(
    summary.budget.id,
    undefined,
    summary.month,
    summary.snapshotVersion,
    active,
    undefined,
    { limit: 5, range: historical ? undefined : 'account' },
  );
  return (
    <View style={styles.section}>
      <AppText variant="heading" accessibilityRole="header">
        {historical ? `Transactions · ${monthLabel(summary.month)}` : 'Account transactions'}
      </AppText>
      {activity.items.map(({ transaction }) => (
        <View key={transaction.id} accessible style={styles.row}>
          <View style={styles.description}>
            <AppText variant="label">
              {transaction.text || transaction.counterparty || 'Transaction'}
            </AppText>
            <AppText variant="small">
              {transaction.date ?? 'Date unknown'} ·{' '}
              {transaction.status === 'UNKNOWN'
                ? 'Status unknown'
                : transaction.status.toLowerCase()}
              {transaction.direction === 'UNKNOWN' ? ' · Direction unknown' : ''}
            </AppText>
          </View>
          <AppText variant="label" style={styles.amount}>
            {transactionAmount(transaction)}
          </AppText>
        </View>
      ))}
      {activity.loading ? <AppText>Loading transactions…</AppText> : null}
      {activity.error ? (
        <>
          <AppText accessibilityRole="alert">Could not load transactions.</AppText>
          <Button
            variant="secondary"
            label="Retry transactions"
            onPress={() => {
              onRefreshSummary?.();
              activity.retry();
            }}
          />
        </>
      ) : null}
      {!activity.loading && !activity.error && activity.items.length === 0 ? (
        <AppText>
          {historical
            ? 'No recorded transactions for this month.'
            : 'No recorded account transactions.'}
        </AppText>
      ) : null}
      {activity.hasMore ? (
        <Button
          label="Show more"
          accessibilityHint="Shows up to five more transactions."
          variant="secondary"
          disabled={activity.loading}
          onPress={activity.more}
        />
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  section: { gap: spacing.medium },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.medium,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.medium,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  description: { flexGrow: 1, flexShrink: 1, minWidth: '45%' },
  amount: { fontVariant: ['tabular-nums'] },
});
