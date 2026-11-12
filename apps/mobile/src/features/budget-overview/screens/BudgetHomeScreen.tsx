import { Screen } from '../../../foundation/components/Screen';
import { listBudgets } from '../../budget-shared';
import { BudgetsError } from '../components/BudgetsError';
import { BudgetsLoading } from '../components/BudgetsLoading';
import { SavedBudgetsReady } from '../components/SavedBudgetsReady';
import { useSavedBudgets } from '../hooks/useSavedBudgets';
import { BudgetIntroScreen } from './BudgetIntroScreen';
import { useSpendingSummary } from '../hooks/useSpendingSummary';
import { getSpendingSummary } from '../api';
import { AppText } from '../../../foundation/components/AppText';

export function BudgetHomeScreen({
  onCreate,
  onPreview,
  selectedId,
  onSelect,
  active = true,
  load = listBudgets,
  loadSpending = getSpendingSummary,
  onOpenPot,
  onOpenActivity,
}: {
  onCreate: () => void;
  onPreview: () => void;
  selectedId?: string;
  onSelect: (id: string) => void;
  active?: boolean;
  load?: typeof listBudgets;
  loadSpending?: typeof getSpendingSummary;
  onOpenPot?: (budgetId: string, potId: string) => void;
  onOpenActivity?: (budgetId: string) => void;
}) {
  const { state, retry } = useSavedBudgets(active, load, selectedId);
  const selected =
    state.status === 'ready'
      ? (state.budgets.find((budget) => budget.id === selectedId) ??
        (!selectedId ? state.budgets[0] : undefined))
      : undefined;
  const spending = useSpendingSummary(selected?.id, selected?.revision, active, loadSpending);
  if (state.status === 'ready' && !state.budgets.length && !state.refreshing && !selectedId)
    return <BudgetIntroScreen onCreate={onCreate} onPreview={onPreview} />;
  return (
    <Screen>
      {state.status === 'ready' && state.refreshing ? (
        <AppText variant="small">Refreshing saved plans…</AppText>
      ) : null}
      {state.status === 'ready' && state.refreshError ? (
        <AppText accessibilityRole="alert">
          Could not refresh saved plans. Showing the previously loaded plan; use Refresh budgets to
          retry.
        </AppText>
      ) : null}
      {state.status === 'loading' || (state.status === 'ready' && state.refreshing && !selected) ? (
        <BudgetsLoading />
      ) : state.status === 'error' ||
        (state.status === 'ready' && state.refreshError && !selected) ? (
        <BudgetsError onRetry={retry} onPreview={onPreview} />
      ) : (
        <SavedBudgetsReady
          budgets={state.budgets}
          selected={selected}
          onSelect={onSelect}
          onCreate={onCreate}
          onRetry={retry}
          spending={spending.state}
          onRetrySpending={spending.retry}
          onOpenPot={onOpenPot}
          onOpenActivity={onOpenActivity}
        />
      )}
    </Screen>
  );
}
