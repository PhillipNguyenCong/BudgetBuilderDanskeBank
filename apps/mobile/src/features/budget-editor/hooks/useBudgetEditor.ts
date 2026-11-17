import type { BillSuggestion, BudgetPlan, SalarySuggestion } from '@budget-builder/contracts';
import { insertSuggestedBills } from '../editor/suggestedBills';
import { useMemo, useState, useRef, useEffect } from 'react';
import type { proposeSavingsUpdate } from '@budget-builder/budget-core/allocations';
import { allocationProgress } from '../editor/allocationProgress';
import {
  amountText,
  createDraft,
  newRow,
  nextId,
  validateDraft,
  type Draft,
  type DraftWidget,
} from '../editor/draft';
export function useBudgetEditor({
  initialPlan,
  salarySuggestion,
  startBlank,
  busy,
  onDirty,
}: {
  initialPlan: BudgetPlan;
  salarySuggestion?: SalarySuggestion | undefined;
  startBlank: boolean;
  busy: boolean;
  onDirty?: () => void;
}) {
  const initialDraft = () => {
    const value = createDraft(initialPlan);
    if (startBlank)
      value.widgets.forEach((widget) =>
        widget.rows.forEach((row) => {
          row.input = '';
          row.originalInput = '';
        }),
      );
    return value;
  };
  const [draft, setDraft] = useState(initialDraft);
  const [committedAmounts, setCommittedAmounts] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      initialDraft().widgets.flatMap((widget) => widget.rows.map((row) => [row.id, row.input])),
    ),
  );
  const salaryTouched = useRef(false);
  const [salaryApplied, setSalaryApplied] = useState(false);
  useEffect(() => {
    const suggestion = salarySuggestion?.suggestion;
    if (!startBlank || !suggestion || busy || salaryTouched.current || salaryApplied) return;
    salaryTouched.current = true;
    const text = amountText(suggestion.amountOere);
    setDraft((current) => ({
      ...current,
      widgets: current.widgets.map((widget) =>
        widget.type === 'INCOME'
          ? {
              ...widget,
              rows: widget.rows.map((row, index) =>
                index === 0 ? { ...row, input: text, confirmedAmount: suggestion.amountOere } : row,
              ),
            }
          : widget,
      ),
    }));
    const income = draft.widgets.find((widget) => widget.type === 'INCOME')?.rows[0];
    if (income) setCommittedAmounts((current) => ({ ...current, [income.id]: text }));
    setSalaryApplied(true);
  }, [salarySuggestion, startBlank, busy, salaryApplied, draft.widgets]);
  const [overlayId, setOverlayId] = useState<string>();
  const overlay = draft.widgets.find((widget) => widget.id === overlayId);
  const [reviewSavings, setReviewSavings] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const result = validateDraft(draft);
  const progress = allocationProgress(
    useMemo(
      () => ({
        ...draft,
        widgets: draft.widgets.map((widget) => ({
          ...widget,
          rows: widget.rows.map((row) => ({
            ...row,
            input: committedAmounts[row.id] ?? '',
          })),
        })),
      }),
      [committedAmounts, draft],
    ),
  );
  function update(value: Draft) {
    if (busy) return;
    setDraft(value);
    setReviewed(false);
    onDirty?.();
  }
  function changeWidget(widget: DraftWidget) {
    if (busy) return;
    const previous = draft.widgets.find((item) => item.id === widget.id);
    if (
      widget.type === 'INCOME' &&
      widget.rows.some(
        (row) => row.input !== previous?.rows.find((item) => item.id === row.id)?.input,
      )
    ) {
      salaryTouched.current = true;
      setSalaryApplied(false);
    }
    update({
      ...draft,
      widgets: draft.widgets.map((item) => (item.id === widget.id ? widget : item)),
    });
  }
  function applySavings(proposal: ReturnType<typeof proposeSavingsUpdate>) {
    update({
      ...draft,
      widgets: draft.widgets.map((widget) =>
        widget.id === proposal.potId
          ? {
              ...widget,
              rows: widget.rows.map((row) =>
                row.id === proposal.rowId
                  ? {
                      ...row,
                      input: amountText(proposal.afterOere),
                      confirmedAmount: proposal.afterOere,
                    }
                  : row,
              ),
            }
          : widget,
      ),
    });
    setCommittedAmounts((amounts) => ({
      ...amounts,
      [proposal.rowId]: amountText(proposal.afterOere),
    }));
    setReviewSavings(false);
  }
  function addRow() {
    if (overlay) changeWidget({ ...overlay, rows: [...overlay.rows, newRow(nextId(draft))] });
  }
  function addSuggestedBills(targetId: string, suggestions: BillSuggestion[], onlyIfEmpty = false) {
    if (busy || !suggestions.length) return;
    setDraft((current) => {
      const next = insertSuggestedBills(current, targetId, suggestions, onlyIfEmpty);
      setCommittedAmounts((amounts) => ({
        ...amounts,
        ...Object.fromEntries(
          next.widgets.flatMap((widget) => widget.rows.map((row) => [row.id, row.input])),
        ),
      }));
      return next;
    });
    setReviewed(false);
    onDirty?.();
  }
  function commitAmount(rowId: string) {
    const row = draft.widgets.flatMap((widget) => widget.rows).find((item) => item.id === rowId);
    if (row) setCommittedAmounts((amounts) => ({ ...amounts, [rowId]: row.input }));
  }
  return {
    draft,
    overlay,
    reviewSavings,
    reviewed,
    result,
    progress,
    update,
    changeWidget,
    addRow,
    addSuggestedBills,
    commitAmount,
    applySavings,
    setOverlayId,
    setReviewSavings,
    setReviewed,
  };
}
