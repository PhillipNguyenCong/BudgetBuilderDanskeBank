import {
  calculateAllocationProgress,
  monthlyBillAllocation,
  type DraftAmount,
} from '@budget-builder/budget-core/allocations';
import { parseAmount, type Draft, type DraftRow } from './draft';

export function allocationProgress(draft: Draft) {
  const amount = (row: DraftRow, fixed = false): DraftAmount => {
    if (fixed && row.needsFrequencyReview) return 'invalid';
    if (!row.input.trim()) return null;
    const parsed = parseAmount(row).amount;
    if (parsed === undefined) return 'invalid';
    return fixed ? monthlyBillAllocation(parsed, row.frequency) : parsed;
  };
  return calculateAllocationProgress(
    draft.widgets[0]?.rows.map((row) => amount(row)) ?? [],
    draft.widgets.slice(1).map((widget) => ({
      id: widget.id,
      amounts: widget.rows.map((row) => amount(row, widget.type === 'FIXED_EXPENSE')),
    })),
  );
}
