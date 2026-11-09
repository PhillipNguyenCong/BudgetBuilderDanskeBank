import { act, renderHook } from '@testing-library/react-native';
import type { ComponentRef } from 'react';
import { ScrollView, TextInput } from 'react-native';
import { newRow, type DraftRow } from '../editor/draft';
import { useBillFocus } from './useBillFocus';

it('focuses the new native input once, scrolls to it and moves focus without blurring the keyboard', async () => {
  const name = { focus: jest.fn(), blur: jest.fn(), measureLayout: jest.fn() };
  const amount = { focus: jest.fn(), blur: jest.fn(), measureLayout: jest.fn() };
  const scrollTo = jest.fn();
  const container = {};
  const scheduled: FrameRequestCallback[] = [];
  const raf = jest.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((callback) => {
    scheduled.push(callback);
    return scheduled.length;
  });
  try {
    const row = newRow('existing');
    const added = newRow('new');
    const { result, rerender } = await renderHook<
      ReturnType<typeof useBillFocus>,
      { rows: DraftRow[] }
    >(({ rows }) => useBillFocus(rows, true), {
      initialProps: { rows: [row] },
    });
    result.current.scroll.current = {
      getInnerViewRef: () => container,
      scrollTo,
    } as unknown as ComponentRef<typeof ScrollView>;
    result.current.register(added.id, 'name', name as unknown as ComponentRef<typeof TextInput>);
    result.current.register(
      added.id,
      'amount',
      amount as unknown as ComponentRef<typeof TextInput>,
    );
    const add = jest.fn();
    await act(() => result.current.add(add));
    expect(add).toHaveBeenCalledTimes(1);
    await rerender({ rows: [row, added] });
    expect(name.focus).toHaveBeenCalledTimes(1);
    name.measureLayout.mockImplementation((_container, success) => success(0, 420));
    await act(() => scheduled.at(-1)!(0));
    expect(scrollTo).toHaveBeenCalledWith({ y: 404, animated: true });
    await rerender({ rows: [row, { ...added, label: 'Insurance' }] });
    expect(name.focus).toHaveBeenCalledTimes(1);
    await act(() => result.current.focus(added.id, 'amount'));
    expect(amount.focus).toHaveBeenCalledTimes(1);
    expect(name.blur).not.toHaveBeenCalled();
    await act(() => result.current.onBlur(added.id, 'name'));
    expect(result.current.active).toEqual({ rowId: added.id, field: 'amount' });
    await act(() => result.current.dismiss());
    expect(amount.blur).toHaveBeenCalledTimes(1);
    expect(result.current.active).toBeNull();
  } finally {
    raf.mockRestore();
  }
});
