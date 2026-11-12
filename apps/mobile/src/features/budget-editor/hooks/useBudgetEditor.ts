import type { BillSuggestion, BudgetPlan } from '@budget-builder/contracts';
import { insertSuggestedBills } from '../editor/suggestedBills';
import { useMemo, useState } from 'react';
import { typeLabels } from '../../budget-shared';
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
  startBlank,
  busy,
  onDirty,
}: {
  initialPlan: BudgetPlan;
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
    update({
      ...draft,
      widgets: draft.widgets.map((item) => (item.id === widget.id ? widget : item)),
    });
  }
  function addPot(type: BudgetPlan['pots'][number]['type']) {
    const id = nextId(draft);
    const widget: DraftWidget = {
      id,
      name: `New ${typeLabels[type].toLowerCase()}`,
      type,
      color: type === 'SAVINGS' ? 'MINT' : type === 'SPENDING' ? 'SKY' : 'SAND',
      rows: [{ ...newRow(`${id}-row`), label: `New ${typeLabels[type].toLowerCase()}` }],
      ...(type === 'SPENDING'
        ? { rollover: { enabled: false, destination: null, targetPotId: null } }
        : {}),
    };
    update({ ...draft, widgets: [...draft.widgets, widget] });
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
    addPot,
    addRow,
    addSuggestedBills,
    commitAmount,
    applySavings,
    setOverlayId,
    setReviewSavings,
    setReviewed,
  };
}
