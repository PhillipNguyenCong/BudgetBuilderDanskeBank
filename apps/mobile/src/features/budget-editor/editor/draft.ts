import { calculatePlan, monthlyBillAllocation } from '@budget-builder/budget-core/allocations';
import { BudgetPlanSchema, type BudgetPlan, type BudgetTotals } from '@budget-builder/contracts';
import { formatDkk } from '../../budget-shared';

type Row = Extract<BudgetPlan['pots'][number], { type: 'FIXED_EXPENSE' }>['rows'][number];
export type DraftRow = Row & {
  input: string;
  original: Row;
  originalInput: string;
  confirmedAmount?: number;
};
export type DraftWidget = Omit<BudgetPlan['income'], 'rows'> & {
  type: 'INCOME' | BudgetPlan['pots'][number]['type'];
  rows: DraftRow[];
  rollover?: Extract<BudgetPlan['pots'][number], { type: 'SPENDING' }>['rollover'];
};
export type Draft = { name: string; widgets: DraftWidget[] };

export function amountText(amountOere: number): string {
  const amount = BigInt(amountOere);
  return `${amount / 100n}${amount % 100n ? `.${String(amount % 100n).padStart(2, '0')}` : ''}`;
}
export function draftRow(row: Row): DraftRow {
  return {
    ...row,
    original: { ...row, ...row.originalSuggestion },
    input: amountText(row.amountOere),
    originalInput: amountText(row.amountOere),
  };
}
export function createDraft(plan: BudgetPlan): Draft {
  return {
    name: plan.name,
    widgets: [{ ...plan.income, type: 'INCOME' as const }, ...plan.pots].map((widget) => ({
      ...widget,
      rows: widget.rows.map(draftRow),
    })),
  };
}
export function parseAmount(
  row: DraftRow,
): { amount: number; error?: never } | { error: string; amount?: never } {
  // Preserve existing exact amounts until explicitly edited; never round on load.
  if (row.input === row.originalInput && row.originalInput !== '')
    return { amount: row.amountOere };
  if (row.confirmedAmount !== undefined && row.input === amountText(row.confirmedAmount))
    return { amount: row.confirmedAmount };
  const text = row.input.trim();
  if (!text) return { error: 'Enter a whole-DKK amount.' };
  if (!/^\d+$/.test(text)) return { error: 'Use a non-negative whole-DKK amount.' };
  if (text.length > 16) return { error: 'This amount is too large.' };
  const amount = BigInt(text) * 100n;
  if (amount > BigInt(Number.MAX_SAFE_INTEGER)) return { error: 'This amount is too large.' };
  return { amount: Number(amount) };
}
export function isAdjusted(row: DraftRow): boolean {
  const value = parseAmount(row);
  return (
    (!row.originalSuggestion && !!row.adjustedByUser) ||
    row.label !== row.original.label ||
    (row.frequency ?? 'MONTHLY') !== (row.original.frequency ?? 'MONTHLY') ||
    (value.amount !== row.original.amountOere && row.input !== '')
  );
}
export function validateDraft(draft: Draft): {
  plan?: BudgetPlan;
  totals?: BudgetTotals;
  error?: string;
} {
  if (!draft.widgets[0]?.rows.length)
    return {
      error: 'Add an income row and enter your monthly income, including zero if applicable.',
    };
  if (draft.widgets.some((widget) => widget.rows.some((row) => parseAmount(row).error))) {
    return { error: 'Complete the highlighted amounts to calculate the plan.' };
  }
  const widgets = draft.widgets.map(({ type, rollover, rows, ...widget }) => ({
    ...widget,
    ...(type === 'INCOME' ? {} : { type }),
    ...(type === 'SPENDING' ? { rollover } : {}),
    rows: rows.map((row) => ({
      id: row.id,
      label: row.label,
      amountOere: parseAmount(row).amount,
      ...(type === 'FIXED_EXPENSE' && row.frequency ? { frequency: row.frequency } : {}),
      ...(row.source ? { source: row.source } : {}),
      ...(row.source?.kind === 'SUGGESTED'
        ? {
            originalSuggestion: row.originalSuggestion ?? {
              label: row.original.label,
              amountOere: row.original.amountOere,
              ...(type === 'FIXED_EXPENSE' && row.original.frequency
                ? { frequency: row.original.frequency }
                : {}),
            },
          }
        : {}),
      ...(isAdjusted(row) || row.adjustedByUser !== undefined
        ? { adjustedByUser: isAdjusted(row) }
        : {}),
    })),
  }));
  const result = BudgetPlanSchema.safeParse({
    name: draft.name,
    income: widgets[0],
    pots: widgets.slice(1),
  });
  if (!result.success)
    return {
      error:
        'Check names, row labels and pot settings. Names must contain 1–100 characters and at least one pot is required.',
    };
  try {
    const totals = calculatePlan(result.data);
    return {
      plan: result.data,
      totals,
      ...(totals.unallocatedOere < 0
        ? {
            error: `Over-allocated by ${formatDkk(-totals.unallocatedOere)}. Reduce allocations or adjust income.`,
          }
        : {}),
    };
  } catch {
    return { error: 'The combined amounts are too large. Reduce them before continuing.' };
  }
}

export function widgetTotal(widget: DraftWidget): string {
  if (widget.rows.some((row) => parseAmount(row).error)) return 'Amount incomplete';
  const plan: BudgetPlan = {
    name: 'Total',
    income: {
      id: widget.id,
      name: widget.name,
      color: widget.color,
      rows: widget.rows.map((row) => ({
        id: row.id,
        label: row.label,
        amountOere:
          widget.type === 'FIXED_EXPENSE'
            ? monthlyBillAllocation(parseAmount(row).amount!, row.frequency)
            : parseAmount(row).amount!,
      })),
    },
    pots: [],
  };
  try {
    return formatDkk(calculatePlan(plan).incomeOere);
  } catch {
    return 'Total too large';
  }
}

export function newRow(id: string): DraftRow {
  return { ...draftRow({ id, label: '', amountOere: 0 }), input: '', originalInput: '' };
}
export function nextId(draft: Draft): string {
  const used = new Set(
    draft.widgets.flatMap((widget) => [widget.id, ...widget.rows.map((row) => row.id)]),
  );
  let index = 1;
  while (used.has(`draft-${index}`)) index++;
  return `draft-${index}`;
}
