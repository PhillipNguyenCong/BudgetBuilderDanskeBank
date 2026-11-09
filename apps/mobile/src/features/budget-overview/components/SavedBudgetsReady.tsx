import type { Budget } from '@budget-builder/contracts';
import { AppText } from '../../../foundation/components/AppText';
import { Button } from '../../../foundation/components/Button';
import { SavedBudgetOverview } from './SavedBudgetOverview';

export function SavedBudgetsReady({
  budgets,
  selected,
  onSelect,
  onCreate,
  onRetry,
}: {
  budgets: Budget[];
  selected?: Budget;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onRetry: () => void;
}) {
  return (
    <>
      <AppText variant="heading" accessibilityRole="header">
        Your budgets
      </AppText>
      {budgets.map((budget) => (
        <Button
          key={budget.id}
          label={`Open ${budget.plan.name}`}
          variant="secondary"
          onPress={() => onSelect(budget.id)}
        />
      ))}
      {selected ? (
        <SavedBudgetOverview budget={selected} />
      ) : (
        <AppText>
          The selected budget is unavailable. Choose one of your saved budgets above.
        </AppText>
      )}
      <Button label="Create another budget" onPress={onCreate} />
      <Button label="Refresh budgets" variant="secondary" onPress={onRetry} />
    </>
  );
}
