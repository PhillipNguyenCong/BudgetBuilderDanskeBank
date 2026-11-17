import type { BudgetPlan, BudgetTotals } from '@budget-builder/contracts';
import { monthlyBillAllocation } from '@budget-builder/budget-core/allocations';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../foundation/components/AppText';
import { Card } from '../../../foundation/components/Card';
import { colors } from '../../../foundation/theme/theme';
import { billFrequencyLabels, formatDkk } from '../../budget-shared';

export function BudgetReview({
  plan,
  totals,
  account,
}: {
  plan: BudgetPlan;
  totals: BudgetTotals;
  account?: string;
}) {
  return (
    <Card style={styles.card}>
      <AppText variant="heading" accessibilityRole="header">
        Budget overview
      </AppText>
      <View style={styles.group}>
        <AppText variant="label">{plan.name}</AppText>
        {account ? (
          <AppText variant="small" style={styles.secondary}>
            {account}
          </AppText>
        ) : null}
      </View>
      <Figure label="Income per month" amount={totals.incomeOere} />
      {plan.income.rows.length > 1
        ? plan.income.rows.map((row) => (
            <Figure key={row.id} label={row.label} amount={row.amountOere} />
          ))
        : null}
      {plan.pots.map((pot) => (
        <View key={pot.id} style={styles.group}>
          <Figure
            label={
              pot.type === 'SPENDING'
                ? plan.pots.filter((p) => p.type === 'SPENDING').length === 1
                  ? 'Budget per month'
                  : `${pot.name} per month`
                : `${pot.name} per month`
            }
            amount={totals.pots.find((p) => p.id === pot.id)!.allocationOere}
          />
          {pot.type === 'FIXED_EXPENSE' ? (
            <>
              {!pot.rows.length ? (
                <AppText variant="small" style={styles.secondary}>
                  No bills
                </AppText>
              ) : null}
              {pot.rows.map((row) => (
                <View key={row.id} style={styles.bill}>
                  <Figure label={row.label} amount={row.amountOere} />
                  <AppText variant="small" style={styles.secondary}>
                    {billFrequencyLabels[row.frequency ?? 'MONTHLY']}
                    {row.frequency && row.frequency !== 'MONTHLY'
                      ? ` · ${formatDkk(monthlyBillAllocation(row.amountOere, row.frequency))}/month`
                      : ''}
                  </AppText>
                </View>
              ))}
            </>
          ) : pot.rows.length > 1 ? (
            pot.rows.map((row) => <Figure key={row.id} label={row.label} amount={row.amountOere} />)
          ) : null}
        </View>
      ))}
      <View style={styles.balance}>
        <Figure label="Income" amount={totals.incomeOere} />
        <Figure label="Monthly allocation" amount={totals.allocatedOere} />
        <AppText variant="label">
          {totals.unallocatedOere === 0
            ? 'Fully allocated'
            : 'Return to allocation to balance your budget.'}
        </AppText>
      </View>
    </Card>
  );
}
function Figure({ label, amount }: { label: string; amount: number }) {
  return (
    <View style={styles.figure}>
      <AppText style={styles.label}>{label}</AppText>
      <AppText variant="label">{formatDkk(amount)}</AppText>
    </View>
  );
}
const styles = StyleSheet.create({
  card: { padding: 16, borderRadius: 16, gap: 16 },
  group: { gap: 8 },
  figure: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: 8,
  },
  label: { flexShrink: 1 },
  bill: { gap: 2, paddingTop: 8, borderTopWidth: 1, borderColor: colors.line },
  secondary: { color: colors.muted },
  balance: { gap: 8, borderTopWidth: 1, borderColor: colors.line, paddingTop: 12 },
});
