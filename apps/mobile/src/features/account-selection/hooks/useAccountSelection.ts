import { useEffect, useState } from 'react';
import { loadAccountSelection, type AccountSelectionData } from '../api/accounts';
type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: AccountSelectionData };
export function useAccountSelection(load = loadAccountSelection) {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading' });
    setSelectedId(null);
    load(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setState({ status: 'ready', data });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setState({
            status: 'error',
            message: error instanceof Error ? error.message : 'Could not load your accounts.',
          });
      });
    return () => controller.abort();
  }, [attempt, load]);
  return { state, selectedId, setSelectedId, retry: () => setAttempt((value) => value + 1) };
}
