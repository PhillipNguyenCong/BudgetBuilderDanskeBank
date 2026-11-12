import type { BillSuggestions } from '@budget-builder/contracts';
import { useEffect, useRef, useState } from 'react';
export type BillSuggestionLoader = (signal: AbortSignal) => Promise<BillSuggestions>;
export type BillDiscoveryState = {
  status: 'idle' | 'loading' | 'ready' | 'error';
  data: BillSuggestions | null;
  error: string | null;
};
export function useBillSuggestions(
  load: BillSuggestionLoader | undefined,
  onComplete: (data: BillSuggestions, targetId: string, auto: boolean) => void,
) {
  const [state, setState] = useState<BillDiscoveryState>({
    status: 'idle',
    data: null,
    error: null,
  });
  const [dismissed, setDismissed] = useState<string[]>([]);
  const handler = useRef(onComplete);
  handler.current = onComplete;
  const controller = useRef<AbortController | null>(null);
  const started = useRef(false);
  useEffect(
    () => () => {
      controller.current?.abort();
    },
    [load],
  );
  function request(targetId: string, auto: boolean) {
    if (!load || (controller.current && !controller.current.signal.aborted)) return;
    started.current = true;
    const current = new AbortController();
    controller.current = current;
    setState((previous) => ({ ...previous, status: 'loading', error: null }));
    Promise.resolve()
      .then(() => load(current.signal))
      .then((data) => {
        if (current.signal.aborted) return;
        setState({ status: 'ready', data, error: null });
        handler.current(data, targetId, auto);
      })
      .catch(() => {
        if (!current.signal.aborted)
          setState((previous) => ({
            ...previous,
            status: 'error',
            error: 'Could not find bills right now. You can still add bills manually.',
          }));
      })
      .finally(() => {
        if (controller.current === current) controller.current = null;
      });
  }
  return {
    state,
    dismissed,
    open: (targetId: string) => {
      if (!started.current) request(targetId, true);
    },
    refresh: (targetId: string) => request(targetId, false),
    dismiss: (keys: string[]) => setDismissed((previous) => [...new Set([...previous, ...keys])]),
  };
}
