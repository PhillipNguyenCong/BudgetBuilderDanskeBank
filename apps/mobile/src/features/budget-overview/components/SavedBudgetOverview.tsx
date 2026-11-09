import type { Budget } from '@budget-builder/contracts';
import { StyleSheet, View } from 'react-native';
import { spacing } from '../../../foundation/theme/theme';
import { ForecastUnavailableNotice } from './ForecastUnavailableNotice';
import { SavedBudgetHeading } from './SavedBudgetHeading';
import { SavedBudgetTotals } from './SavedBudgetTotals';
import { SavedPotCard } from './SavedPotCard';

export function SavedBudgetOverview({ budget }: { budget: Budget }) {
  const widgets = [{ ...budget.plan.income, type: 'INCOME' as const }, ...budget.plan.pots];
  return (
    <View style={styles.content}>
      <SavedBudgetHeading budget={budget} />
      <SavedBudgetTotals totals={budget.totals} />
      {widgets.map((widget) => (
        <SavedPotCard key={widget.id} widget={widget} pots={budget.plan.pots} />
      ))}
      <ForecastUnavailableNotice />
    </View>
  );
}
const styles = StyleSheet.create({
  content: { gap: spacing.large },
});
