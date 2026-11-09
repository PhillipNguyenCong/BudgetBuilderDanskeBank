import { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import type { Budget } from '@budget-builder/contracts';
import { AppText } from '../../../foundation/components/AppText';
import { Button } from '../../../foundation/components/Button';
import { Screen } from '../../../foundation/components/Screen';
import { listBudgets } from '../api/budgets';
import { BudgetIntroScreen } from './BudgetIntroScreen';
import { SavedBudgetOverview } from '../components/SavedBudgetOverview';

type State = { status: 'loading' } | { status: 'error' } | { status: 'ready'; budgets: Budget[] };
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
  const [state, setState] = useState<State>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    setState({ status: 'loading' });
    load(controller.signal)
      .then((budgets) => {
        if (!controller.signal.aborted) setState({ status: 'ready', budgets });
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: 'error' });
      });
    return () => controller.abort();
  }, [active, attempt, load]);
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
        <>
          <ActivityIndicator accessibilityLabel="Loading budgets" />
          <AppText>Loading your budgets…</AppText>
        </>
      ) : state.status === 'error' ? (
        <>
          <AppText accessibilityRole="alert">
            Could not load your saved budgets. No saved plans have been changed.
          </AppText>
          <Button label="Try again" onPress={() => setAttempt((value) => value + 1)} />
          <Button label="Preview sample widgets" variant="secondary" onPress={onPreview} />
        </>
      ) : (
        <>
          <AppText variant="heading" accessibilityRole="header">
            Your budgets
          </AppText>
          {state.budgets.map((budget) => (
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
          <Button
            label="Refresh budgets"
            variant="secondary"
            onPress={() => setAttempt((value) => value + 1)}
          />
        </>
      )}
    </Screen>
  );
}
