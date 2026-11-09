import { monthlyBillAllocation } from '@budget-builder/budget-core/allocations';
import { billFrequencyLabels } from '../editor/billFrequency';
import type { Budget } from '@budget-builder/contracts';
import { AppText } from '../../../foundation/components/AppText';
import { Card } from '../../../foundation/components/Card';
import { createDraft, formatDkk } from '../editor/draft';
import { View, StyleSheet } from 'react-native';
import { spacing } from '../../../foundation/theme/theme';
import { widgetPalette } from './BudgetWidget';

export function SavedBudgetOverview({ budget }: { budget: Budget }) {
  const draft = createDraft(budget.plan);
  return (
    <View style={styles.content}>
      <AppText variant="title" accessibilityRole="header">
        {budget.plan.name}
      </AppText>
      <AppText>Saved monthly plan</AppText>
      <AppText variant="small">
        Last saved: {budget.updatedAt.slice(0, 10)}. Allocations below are planned amounts, not
        account balances.
      </AppText>
      <Card>
        <AppText>Income: {formatDkk(budget.totals.incomeOere)}</AppText>
        <AppText>Allocated: {formatDkk(budget.totals.allocatedOere)}</AppText>
        <AppText>Unallocated: {formatDkk(budget.totals.unallocatedOere)}</AppText>
      </Card>
      {draft.widgets.map((widget) => (
        <Card key={widget.id} style={{ backgroundColor: widgetPalette[widget.color].background }}>
          <AppText variant="heading" accessibilityRole="header">
            {widget.name}
          </AppText>
          <AppText variant="small">
            {widget.type === 'INCOME'
              ? 'Income'
              : widget.type === 'SAVINGS'
                ? 'Savings allocation'
                : widget.type === 'SPENDING'
                  ? 'Spending allocation'
                  : 'Fixed-expense allocation'}
          </AppText>
          {widget.rows.length ? (
            widget.rows.map((row) => (
              <View key={row.id}>
                <AppText>
                  {row.label}: {formatDkk(row.amountOere)}
                </AppText>
                {widget.type === 'FIXED_EXPENSE' ? (
                  <AppText variant="small">
                    {billFrequencyLabels[row.frequency ?? 'MONTHLY']} ·{' '}
                    {formatDkk(monthlyBillAllocation(row.amountOere, row.frequency))}/month
                  </AppText>
                ) : null}
                {row.adjustedByUser ? <AppText variant="small">Adjusted by you</AppText> : null}
                {row.source ? <AppText variant="small">{row.source.explanation}</AppText> : null}
              </View>
            ))
          ) : (
            <AppText>No rows in this pot.</AppText>
          )}
          {widget.rollover ? (
            <AppText variant="small">
              Rollover preference:{' '}
              {widget.rollover.enabled
                ? widget.rollover.destination === 'TO_NEXT_MONTH'
                  ? 'next month’s spending'
                  : `to ${budget.plan.pots.find((pot) => pot.id === widget.rollover?.targetPotId)?.name ?? 'unavailable savings target'}`
                : 'off'}
              . Month-end processing is not implemented yet.
            </AppText>
          ) : null}
        </Card>
      ))}
      <Card>
        <AppText variant="heading">Forecast unavailable</AppText>
        <AppText>
          Forecasts, actual spending, weekly guidance and accumulated pot balances are not
          calculated yet. Your budget plan has been saved.
        </AppText>
      </Card>
    </View>
  );
}
const styles = StyleSheet.create({ content: { gap: spacing.large } });
