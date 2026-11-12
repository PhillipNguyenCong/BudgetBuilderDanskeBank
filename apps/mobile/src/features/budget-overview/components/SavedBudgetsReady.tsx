import type { Budget } from '@budget-builder/contracts';
import { useRef, type ComponentRef } from 'react';
import { AccessibilityInfo, View } from 'react-native';
import { AppText } from '../../../foundation/components/AppText';
import { Button } from '../../../foundation/components/Button';
import { BudgetSwitcher } from './BudgetSwitcher';
import { SavedBudgetOverview } from './SavedBudgetOverview';
import type { SpendingState } from '../hooks/useSpendingSummary';

export function SavedBudgetsReady({
  budgets,
  selected,
  onSelect,
  onCreate,
  onRetry,
  spending,
  onRetrySpending,
  onOpenPot,
  onOpenActivity,
}: {
  budgets: Budget[];
  selected?: Budget;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onRetry: () => void;
  spending: SpendingState;
  onRetrySpending: () => void;
  onOpenPot?: ((budgetId: string, potId: string) => void) | undefined;
  onOpenActivity?: ((budgetId: string) => void) | undefined;
}) {
  const heading = useRef<ComponentRef<typeof View>>(null);
  function selectBudget(id: string) {
    onSelect(id);
    requestAnimationFrame(() => {
      if (heading.current) AccessibilityInfo.sendAccessibilityEvent(heading.current, 'focus');
    });
  }
  return (
    <>
      {budgets.length > 1 || (!selected && budgets.length > 0) ? (
        <BudgetSwitcher budgets={budgets} selectedId={selected?.id} onSelect={selectBudget} />
      ) : null}
      {selected ? (
        <SavedBudgetOverview
          key={selected.id}
          budget={selected}
          headingFocusTarget={heading}
          spending={spending}
          onRetrySpending={onRetrySpending}
          onOpenPot={onOpenPot}
          onOpenActivity={onOpenActivity}
        />
      ) : (
        <AppText accessibilityRole="alert">
          {budgets.length
            ? 'The selected budget is unavailable. Choose one of your saved budgets above.'
            : 'No saved budget matches this selection. Refresh budgets or create a budget.'}
        </AppText>
      )}
      <Button label="Create another budget" variant="secondary" onPress={onCreate} />
      <Button label="Refresh budgets" variant="secondary" onPress={onRetry} />
    </>
  );
}
