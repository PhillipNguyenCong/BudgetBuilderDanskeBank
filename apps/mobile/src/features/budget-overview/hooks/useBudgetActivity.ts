import { useCallback, useEffect, useRef, useState } from 'react';
import type { ClassifiedTransaction } from '@budget-builder/contracts';
import { getBudgetActivity } from '../api';
export function useBudgetActivity(
  id: string | undefined,
  potId: string | undefined,
  month: string | undefined,
  snapshotVersion: string | undefined,
  active = true,
  load = getBudgetActivity,
) {
  const [state, setState] = useState({
    ownerScope: '',
    items: [] as ClassifiedTransaction[],
    loading: true,
    error: false,
    hasMore: false,
  });
  const [offset, setOffset] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const scope = JSON.stringify([id, potId, month, snapshotVersion]);
  const previous = useRef({ scope: '', active: false });
  useEffect(() => {
    const restart = previous.current.scope !== scope || !previous.current.active;
    previous.current = { scope, active };
    if (!id || !active) return;
    if (restart) {
      setState({ ownerScope: scope, items: [], loading: true, error: false, hasMore: false });
      if (offset !== 0) {
        setOffset(0);
        return;
      }
    }
    const controller = new AbortController();
    setState((previous) => ({ ...previous, ownerScope: scope, loading: true, error: false }));
    load(
      id,
      {
        offset,
        ...(potId ? { potId } : {}),
        ...(month ? { month } : {}),
        ...(snapshotVersion ? { expectedSnapshotVersion: snapshotVersion } : {}),
      },
      controller.signal,
    )
      .then((page) => {
        if (snapshotVersion && page.snapshotVersion !== snapshotVersion)
          throw new Error('Spending inputs changed.');
        if (!controller.signal.aborted)
          setState((previous) => ({
            ownerScope: scope,
            items: offset === 0 ? page.items : [...previous.items.slice(0, offset), ...page.items],
            hasMore: page.page.hasMore,
            loading: false,
            error: false,
          }));
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setState({ ownerScope: scope, items: [], error: true, loading: false, hasMore: false });
      });
    return () => controller.abort();
  }, [id, potId, month, snapshotVersion, scope, offset, attempt, active, load]);
  return {
    ...(state.ownerScope === scope
      ? state
      : { items: [], loading: true, error: false, hasMore: false }),
    more: () => {
      if (!state.loading && state.hasMore) setOffset(state.items.length);
    },
    retry: () => setAttempt((value) => value + 1),
    reload: useCallback(() => {
      setState((previous) => ({
        ...previous,
        items: [],
        loading: true,
        error: false,
        hasMore: false,
      }));
      setOffset(0);
      setAttempt((value) => value + 1);
    }, []),
  };
}
