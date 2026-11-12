import { act, renderHook, waitFor } from '@testing-library/react-native';
import { activityItem } from '../../../tests/spendingFixtures';
import { getBudgetActivity } from '../api';
import { useBudgetActivity } from './useBudgetActivity';

it('US-06: re-entry restarts paginated activity instead of retaining stale earlier pages', async () => {
  let changed = false;
  const version = 'a'.repeat(64);
  const load = jest.fn<ReturnType<typeof getBudgetActivity>, Parameters<typeof getBudgetActivity>>(
    async (_id, options) => ({
      budgetRevision: 1,
      snapshotVersion: version,
      snapshotDate: '2026-10-15',
      items: [
        {
          ...activityItem(),
          transaction: {
            ...activityItem().transaction,
            id: options?.offset ? 'second' : 'first',
            text: changed ? 'Updated source classification' : 'Original record',
          },
        },
      ],
      page: { offset: options?.offset ?? 0, limit: 1, total: 2, hasMore: !options?.offset },
    }),
  );
  const hook = await renderHook<ReturnType<typeof useBudgetActivity>, { active: boolean }>(
    ({ active }) => useBudgetActivity('saved', undefined, undefined, version, active, load),
    { initialProps: { active: true } },
  );
  await waitFor(() => expect(hook.result.current.items).toHaveLength(1));
  await act(() => hook.result.current.more());
  await waitFor(() => expect(hook.result.current.items).toHaveLength(2));
  await hook.rerender({ active: false });
  changed = true;
  await hook.rerender({ active: true });
  await waitFor(() => expect(hook.result.current.items).toHaveLength(1));
  expect(load.mock.calls.at(-1)![1]?.offset).toBe(0);
  expect(hook.result.current.items[0]!.transaction.text).toBe('Updated source classification');
});

it('US-06: never renders activity from a different calculation snapshot', async () => {
  const load = jest.fn(async () => ({
    budgetRevision: 2,
    snapshotVersion: 'b'.repeat(64),
    snapshotDate: '2026-10-15',
    items: [activityItem()],
    page: { offset: 0, limit: 25, total: 1, hasMore: false },
  }));
  const hook = await renderHook(() =>
    useBudgetActivity('saved', undefined, undefined, 'a'.repeat(64), true, load),
  );
  await waitFor(() => expect(hook.result.current.error).toBe(true));
  expect(hook.result.current.items).toEqual([]);
});
