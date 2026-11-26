import { Button } from '../../../foundation/components/Button';
import { monthLabel } from '../components/budgetMonth';
import { BudgetMonthSchema } from '@budget-builder/contracts';
import { Pressable, View } from 'react-native';
import { colors, spacing } from '../../../foundation/theme/theme';
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
  month,
  onOpenBudgetLog,
  onReturnCurrentMonth,
  onOpenUndated,
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
  month?: string | undefined;
  onOpenBudgetLog?: (budgetId: string) => void;
  onReturnCurrentMonth?: () => void;
  onOpenUndated?: (budgetId: string) => void;
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
  const spending = useSpendingSummary(
    selected?.id,
    selected?.revision,
    active,
    loadSpending,
    month,
  );
  if (state.status === 'ready' && !state.budgets.length && !state.refreshing && !selectedId)
    return <BudgetIntroScreen onCreate={onCreate} onPreview={onPreview} />;
  return (
    <Screen
      contentStyle={selected ? { paddingTop: spacing.small, gap: spacing.medium } : undefined}
    >
      {selected && onOpenBudgetLog ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: spacing.small,
          }}
        >
          <AppText variant="label">
            {BudgetMonthSchema.safeParse(
              month ?? (spending.state.status === 'ready' ? spending.state.data.month : undefined),
            ).success
              ? monthLabel(
                  month ?? (spending.state.status === 'ready' ? spending.state.data.month : ''),
                )
              : 'Monthly overview'}
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Budget log"
            onPress={() => onOpenBudgetLog(selected.id)}
            style={{ minHeight: 44, minWidth: 44, justifyContent: 'center' }}
          >
            <AppText variant="label" style={{ color: colors.blue }}>
              Budget log
            </AppText>
          </Pressable>
        </View>
      ) : null}
      {selected && month && spending.state.status === 'error' && onReturnCurrentMonth ? (
        <Button label="Current month" variant="secondary" onPress={onReturnCurrentMonth} />
      ) : null}
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
          active={active}
          budgets={state.budgets}
          selected={selected}
          onSelect={onSelect}
          onCreate={onCreate}
          onRetry={retry}
          showRefresh={
            !!state.refreshError ||
            !selected ||
            spending.state.status === 'error' ||
            (spending.state.status === 'ready' && !!spending.state.error)
          }
          spending={spending.state}
          onRetrySpending={spending.retry}
          onOpenPot={onOpenPot}
          onOpenActivity={onOpenActivity}
          onOpenUndated={onOpenUndated}
        />
      )}
    </Screen>
  );
}
