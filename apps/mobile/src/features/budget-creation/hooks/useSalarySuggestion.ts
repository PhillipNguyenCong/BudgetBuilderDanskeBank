import { useEffect, useState } from 'react';
import type { SalarySuggestion } from '@budget-builder/contracts';
export function useSalarySuggestion(
  accountId: string,
  load?: (accountId: string, signal?: AbortSignal) => Promise<SalarySuggestion>,
) {
  const [result, setResult] = useState<{
    accountId: string;
    data?: SalarySuggestion;
    message: string;
  }>();
  useEffect(() => {
    const controller = new AbortController();
    if (load)
      void Promise.resolve()
        .then(() => load(accountId, controller.signal))
        .then((data) => {
          if (!controller.signal.aborted) setResult({ accountId, data, message: data.explanation });
        })
        .catch(() => {
          if (!controller.signal.aborted)
            setResult({
              accountId,
              message: 'Salary could not be loaded. You can enter it manually.',
            });
        });
    return () => controller.abort();
  }, [accountId, load]);
  return result?.accountId === accountId ? result : undefined;
}
