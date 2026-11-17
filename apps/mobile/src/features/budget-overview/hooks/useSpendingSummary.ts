import { useCallback, useEffect, useState } from 'react';
import type { SpendingSummary } from '@budget-builder/contracts';
import { getSpendingSummary } from '../api';
export type SpendingState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'ready';
      data: SpendingSummary;
      refreshing: boolean;
      error: string | null;
      requestedMonth?: string | undefined;
    };
export function useSpendingSummary(
  id: string | undefined,
  revision: number | undefined,
  active = true,
  load = getSpendingSummary,
  month?: string,
) {
  const [state, setState] = useState<SpendingState>({ status: 'loading' });
  const [months, setMonths] = useState<{ id: string; items: string[] }>({ id: '', items: [] });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!id || !active) return;
    const controller = new AbortController();
    setState((previous) =>
      previous.status === 'ready' &&
      previous.data.budget.id === id &&
      previous.requestedMonth === month &&
      (revision === undefined || previous.data.budget.revision === revision)
        ? { ...previous, refreshing: true, error: null }
        : { status: 'loading' },
    );
    Promise.resolve()
      .then(() => (month ? load(id, controller.signal, month) : load(id, controller.signal)))
      .then((data) => {
        if (controller.signal.aborted) return;
        if (data.budget.id !== id || (revision !== undefined && data.budget.revision !== revision))
          throw new Error('The budget changed. Refresh budgets to load its latest plan.');
        if (month && data.month !== month) throw new Error('The requested month was not returned.');
        setMonths({ id, items: data.availableMonths ?? [data.month] });
        setState({ status: 'ready', data, refreshing: false, error: null, requestedMonth: month });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const message = error instanceof Error ? error.message : 'Could not load spending.';
        setState((previous) =>
          previous.status === 'ready' &&
          previous.data.budget.id === id &&
          previous.requestedMonth === month
            ? { ...previous, refreshing: false, error: message }
            : { status: 'error', message },
        );
      });
    return () => controller.abort();
  }, [id, revision, active, load, attempt, month]);
  const visible =
    state.status === 'ready' &&
    (state.data.budget.id !== id ||
      state.requestedMonth !== month ||
      (revision !== undefined && state.data.budget.revision !== revision))
      ? { status: 'loading' as const }
      : state;
  return {
    months: months.id === id ? months.items : [],
    state: visible,
    retry: useCallback(() => setAttempt((value) => value + 1), []),
  };
}
