import type { BudgetPlan } from '@budget-builder/contracts';
import { useState } from 'react';
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
  const [draft, setDraft] = useState(() => {
    const value = createDraft(initialPlan);
    if (startBlank)
      value.widgets.forEach((widget) =>
        widget.rows.forEach((row) => {
          row.input = '';
          row.originalInput = '';
        }),
      );
    return value;
  });
  const [overlayId, setOverlayId] = useState<string>();
  const overlay = draft.widgets.find((widget) => widget.id === overlayId);
  const [reviewSavings, setReviewSavings] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const result = validateDraft(draft);
  const progress = allocationProgress(draft);
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
    setReviewSavings(false);
  }
  function addRow() {
    if (overlay) changeWidget({ ...overlay, rows: [...overlay.rows, newRow(nextId(draft))] });
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
    applySavings,
    setOverlayId,
    setReviewSavings,
    setReviewed,
  };
}
