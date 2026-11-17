import { act, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import type { SalarySuggestion } from '@budget-builder/contracts';
import { useSalarySuggestion } from './useSalarySuggestion';
function Harness({
  accountId,
  load,
}: {
  accountId: string;
  load: (accountId: string, signal?: AbortSignal) => Promise<SalarySuggestion>;
}) {
  const result = useSalarySuggestion(accountId, load);
  return <Text>{result?.data?.accountId ?? 'waiting'}</Text>;
}
it('US-10: cancels abandoned salary reads and ignores results from a previous account', async () => {
  const pending: { id: string; signal?: AbortSignal; resolve: (data: SalarySuggestion) => void }[] =
    [];
  const load = jest.fn(
    (id: string, signal?: AbortSignal) =>
      new Promise<SalarySuggestion>((resolve) => pending.push({ id, signal, resolve })),
  );
  const view = await render(<Harness accountId="a" load={load} />);
  await view.rerender(<Harness accountId="b" load={load} />);
  expect(pending[0]!.signal?.aborted).toBe(true);
  await act(() =>
    pending[0]!.resolve({
      accountId: 'a',
      snapshotDate: '2026-09-03',
      suggestion: null,
      explanation: 'No salary',
    }),
  );
  expect(screen.getByText('waiting')).toBeVisible();
  await act(() =>
    pending[1]!.resolve({
      accountId: 'b',
      snapshotDate: '2026-09-03',
      suggestion: null,
      explanation: 'No salary',
    }),
  );
  expect(screen.getByText('b')).toBeVisible();
});
