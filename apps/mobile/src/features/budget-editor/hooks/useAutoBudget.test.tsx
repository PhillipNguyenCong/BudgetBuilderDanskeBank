import { act, renderHook } from '@testing-library/react-native';
import type { BillSuggestions } from '@budget-builder/contracts';
import { manualPlan } from '../../budget-creation/api';
import { billSuggestions } from '../../../tests/billSuggestionFixtures';
import { createDraft } from '../editor/draft';
import { useAutoBudget, type AutoBudgetOptions } from './useAutoBudget';

it('US-04: duplicate confirmations share one run and changed inputs reject stale results', async () => {
  let finish!: (value: BillSuggestions) => void;
  const load = jest.fn(
    (_signal: AbortSignal) =>
      new Promise<BillSuggestions>((resolve) => {
        finish = resolve;
      }),
  );
  const draft = createDraft(manualPlan());
  draft.widgets[0]!.rows[0]!.input = '20000';
  const props: AutoBudgetOptions = {
    draft,
    load,
    dismissed: [],
    disabled: false,
    onApply: jest.fn(),
    onActiveChange: jest.fn(),
  };
  const { result, rerender } = await renderHook(
    (value: AutoBudgetOptions) => useAutoBudget(value),
    { initialProps: props },
  );
  await act(() => result.current.open());
  await act(() => result.current.setCarChoice('no'));
  let task!: Promise<void>;
  await act(() => {
    task = result.current.confirm();
    void result.current.confirm();
  });
  expect(load).toHaveBeenCalledTimes(1);
  await rerender({ ...props, draft: { ...draft, name: 'Changed while loading' } });
  await act(async () => {
    finish(billSuggestions());
    await task;
  });
  expect(props.onApply).not.toHaveBeenCalled();
  expect(result.current.status).toBe('error');
  expect(result.current.error).toMatch(/inputs changed/);
});
