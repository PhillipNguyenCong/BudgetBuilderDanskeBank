import type { Budget } from '@budget-builder/contracts';
import { useEffect, useState } from 'react';
import { listBudgets } from '../../budget-shared';
type State =
  | { status: 'loading' }
  | { status: 'error' }
  | {
      status: 'ready';
      budgets: Budget[];
      refreshing: boolean;
      refreshError: boolean;
      selectionKey: string;
    };
export function useSavedBudgets(active: boolean, load = listBudgets, selectedId?: string) {
  const selectionKey = selectedId ?? '';
  const [state, setState] = useState<State>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    setState((previous) =>
      previous.status === 'ready'
        ? { ...previous, refreshing: true, refreshError: false }
        : { status: 'loading' },
    );
    load(controller.signal)
      .then((budgets) => {
        if (!controller.signal.aborted)
          setState({
            status: 'ready',
            budgets,
            refreshing: false,
            refreshError: false,
            selectionKey,
          });
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setState((previous) =>
            previous.status === 'ready'
              ? { ...previous, refreshing: false, refreshError: true, selectionKey }
              : { status: 'error' },
          );
      });
    return () => controller.abort();
  }, [active, attempt, load, selectionKey]);
  return {
    state:
      state.status === 'ready' && state.selectionKey !== selectionKey
        ? { ...state, refreshing: true }
        : state,
    retry: () => setAttempt((value) => value + 1),
  };
}
