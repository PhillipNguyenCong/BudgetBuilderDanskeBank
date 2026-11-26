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
  const cached = useRef<BillSuggestions | null>(null);
  const pending = useRef<Promise<BillSuggestions> | null>(null);
  const started = useRef(false);
  useEffect(
    () => () => {
      controller.current?.abort();
    },
    [load],
  );
  function fetchData(refresh: boolean, signal?: AbortSignal): Promise<BillSuggestions> {
    if (signal?.aborted) return Promise.reject(new Error('Bill discovery cancelled.'));
    if (!load)
      return Promise.reject(new Error('Bill discovery is unavailable. Enter bills manually.'));
    if (!refresh && cached.current) return Promise.resolve(cached.current);
    if (pending.current && controller.current && !controller.current.signal.aborted)
      return pending.current;
    started.current = true;
    const current = new AbortController();
    controller.current = current;
    const abort = () => {
      current.abort();
      if (controller.current === current) {
        controller.current = null;
        pending.current = null;
        started.current = cached.current !== null;
        setState((previous) => ({
          ...previous,
          status: cached.current ? 'ready' : 'idle',
          error: null,
        }));
      }
    };
    signal?.addEventListener('abort', abort, { once: true });
    setState((previous) => ({ ...previous, status: 'loading', error: null }));
    const task = Promise.resolve()
      .then(() => load(current.signal))
      .then((data) => {
        if (current.signal.aborted) throw new Error('Bill discovery cancelled.');
        cached.current = data;
        setState({ status: 'ready', data, error: null });
        return data;
      })
      .catch(() => {
        const message = 'Could not find bills right now. You can still add bills manually.';
        if (!current.signal.aborted)
          setState((previous) => ({
            ...previous,
            status: 'error',
            error: message,
          }));
        throw new Error(message);
      })
      .finally(() => {
        signal?.removeEventListener('abort', abort);
        if (controller.current === current) {
          controller.current = null;
          pending.current = null;
        }
      });
    pending.current = task;
    return task;
  }
  function request(targetId: string, auto: boolean) {
    void fetchData(true)
      .then((data) => handler.current(data, targetId, auto))
      .catch(() => {});
  }
  return {
    state,
    dismissed,
    loadForAllocation: (signal: AbortSignal) => fetchData(false, signal),
    open: (targetId: string) => {
      if (!started.current) request(targetId, true);
    },
    refresh: (targetId: string) => request(targetId, false),
    dismiss: (keys: string[]) => setDismissed((previous) => [...new Set([...previous, ...keys])]),
  };
}
