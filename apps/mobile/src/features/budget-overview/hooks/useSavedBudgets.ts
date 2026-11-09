import type { Budget } from '@budget-builder/contracts';
import { useEffect, useState } from 'react';
import { listBudgets } from '../../budget-shared';
type State = { status: 'loading' } | { status: 'error' } | { status: 'ready'; budgets: Budget[] };
export function useSavedBudgets(active: boolean, load = listBudgets) {
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
  return { state, retry: () => setAttempt((value) => value + 1) };
}
