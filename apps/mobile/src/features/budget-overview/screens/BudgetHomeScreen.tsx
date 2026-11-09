import { Screen } from '../../../foundation/components/Screen';
import { listBudgets } from '../../budget-shared';
import { BudgetsError } from '../components/BudgetsError';
import { BudgetsLoading } from '../components/BudgetsLoading';
import { SavedBudgetsReady } from '../components/SavedBudgetsReady';
import { useSavedBudgets } from '../hooks/useSavedBudgets';
import { BudgetIntroScreen } from './BudgetIntroScreen';

export function BudgetHomeScreen({
  onCreate,
  onPreview,
  selectedId,
  onSelect,
  active = true,
  load = listBudgets,
}: {
  onCreate: () => void;
  onPreview: () => void;
  selectedId?: string;
  onSelect: (id: string) => void;
  active?: boolean;
  load?: typeof listBudgets;
}) {
  const { state, retry } = useSavedBudgets(active, load);
  if (state.status === 'ready' && !state.budgets.length)
    return <BudgetIntroScreen onCreate={onCreate} onPreview={onPreview} />;
  const selected =
    state.status === 'ready'
      ? (state.budgets.find((budget) => budget.id === selectedId) ??
        (!selectedId ? state.budgets[0] : undefined))
      : undefined;
  return (
    <Screen>
      {state.status === 'loading' ? (
        <BudgetsLoading />
      ) : state.status === 'error' ? (
        <BudgetsError onRetry={retry} onPreview={onPreview} />
      ) : (
        <SavedBudgetsReady
          budgets={state.budgets}
          selected={selected}
          onSelect={onSelect}
          onCreate={onCreate}
          onRetry={retry}
        />
      )}
    </Screen>
  );
}
