import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Keyboard, type ScrollView, type TextInput } from 'react-native';
import type { DraftRow } from '../editor/draft';

export type BillField = 'name' | 'amount';
type ActiveField = { rowId: string; field: BillField };

export function useBillFocus(rows: DraftRow[], enabled: boolean) {
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const inputs = useRef(
    new Map<string, Partial<Record<BillField, ComponentRef<typeof TextInput>>>>(),
  );
  const activeRef = useRef<ActiveField | null>(null);
  const [active, setActive] = useState<ActiveField | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const pendingAddition = useRef<Set<string> | null>(null);
  const frame = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);

  function reveal() {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      const current = activeRef.current;
      const container = scroll.current?.getInnerViewRef();
      const input = current && inputs.current.get(current.rowId)?.[current.field];
      if (input && container)
        input.measureLayout(
          container,
          (_x, y) => scroll.current?.scrollTo({ y: Math.max(0, y - 16), animated: true }),
          () => {},
        );
    });
  }
  function clear() {
    const current = activeRef.current;
    activeRef.current = null;
    setActive(null);
    if (current) inputs.current.get(current.rowId)?.[current.field]?.blur();
  }
  function dismiss() {
    clear();
    Keyboard.dismiss();
  }
  function focus(rowId: string, field: BillField) {
    activeRef.current = { rowId, field };
    setActive({ rowId, field });
    inputs.current.get(rowId)?.[field]?.focus();
    reveal();
  }
  useEffect(() => {
    if (!enabled) return;
    const show = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
      reveal();
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
      clear();
    });
    return () => {
      show.remove();
      hide.remove();
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [enabled]);
  useEffect(() => {
    if (activeRef.current && !rows.some((row) => row.id === activeRef.current?.rowId)) dismiss();
    if (pendingAddition.current) {
      const added = rows.find((row) => !pendingAddition.current!.has(row.id));
      if (added) {
        pendingAddition.current = null;
        focus(added.id, 'name');
      }
    }
  }, [rows]);

  return {
    scroll,
    active,
    keyboardVisible,
    reveal,
    dismiss,
    focus,
    register(rowId: string, field: BillField, input: ComponentRef<typeof TextInput> | null) {
      const fields = inputs.current.get(rowId) ?? {};
      if (input) fields[field] = input;
      else delete fields[field];
      if (Object.keys(fields).length) inputs.current.set(rowId, fields);
      else inputs.current.delete(rowId);
    },
    onFocus(rowId: string, field: BillField) {
      activeRef.current = { rowId, field };
      setActive({ rowId, field });
      reveal();
    },
    onBlur(rowId: string, field: BillField) {
      if (activeRef.current?.rowId === rowId && activeRef.current.field === field) {
        activeRef.current = null;
        setActive(null);
      }
    },
    add(onAdd: () => void) {
      pendingAddition.current = new Set(rows.map((row) => row.id));
      onAdd();
    },
  };
}
export type BillFocus = ReturnType<typeof useBillFocus>;
