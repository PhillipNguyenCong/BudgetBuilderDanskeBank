import {
  allocateAutoBudget,
  AutoAllocationError,
  calculateAllocationProgress,
} from '@budget-builder/budget-core/allocations';
import type { BillSuggestions } from '@budget-builder/contracts';
import { amountText, parseAmount, type Draft } from './draft';
import { insertSuggestedBills, remainingBillSuggestions } from './suggestedBills';

export function autoAllocationIncome(draft: Draft): number {
  const income = draft.widgets.find((widget) => widget.type === 'INCOME');
  const progress = calculateAllocationProgress(
    income?.rows.map((row) => {
      const parsed = parseAmount(row);
      return parsed.error ? 'invalid' : (parsed.amount ?? null);
    }) ?? [],
    [],
  );
  if (progress.status === 'overflow')
    throw new Error('The combined income is too large. Reduce the amounts and try again.');
  if (progress.status !== 'ready' || progress.incomeOere <= 0)
    throw new Error(
      'Enter a complete, valid monthly take-home income above zero before auto allocation.',
    );
  return progress.incomeOere;
}

export function prepareAutoBills(draft: Draft, data: BillSuggestions, dismissed: string[]) {
  const fixed = draft.widgets.find((widget) => widget.type === 'FIXED_EXPENSE');
  if (!fixed) throw new Error('Add a Fixed expenses widget before auto allocation.');
  const candidates = remainingBillSuggestions(draft, data.suggestions, dismissed);
  if (fixed.rows.length + candidates.length > 1000)
    throw new Error('There are too many bills to include automatically. Review your bills first.');
  return insertSuggestedBills(draft, fixed.id, candidates, false);
}

/** Build a new draft in isolation; even an incomplete discovered bill cannot partially apply. */
export function createAutoAllocationDraft(
  draft: Draft,
  data: BillSuggestions,
  dismissed: string[],
) {
  const incomeOere = autoAllocationIncome(draft);
  const next = prepareAutoBills(draft, data, dismissed);
  const bills = next.widgets
    .filter((widget) => widget.type === 'FIXED_EXPENSE')
    .flatMap((widget) => widget.rows)
    .map((row) => {
      const parsed = parseAmount(row);
      if (!row.label.trim() || parsed.amount === undefined)
        throw new Error(
          'Some bills need an amount or name. Open Add bills, add any found bills and complete them, then try again.',
        );
      return { amountOere: parsed.amount, frequency: row.frequency };
    });
  let allocation: ReturnType<typeof allocateAutoBudget>;
  try {
    allocation = allocateAutoBudget(incomeOere, bills);
  } catch (error) {
    if (error instanceof AutoAllocationError && error.code === 'BILLS_EXCEED_CAPACITY')
      throw new Error(
        'Your monthly bills exceed 85% of income. Auto allocation cannot retain 5% for Fun and 10% for Savings. Adjust bills or income, or allocate manually.',
      );
    throw new Error(
      'The combined bill amounts are too large. Review your bills before trying again.',
    );
  }
  const groceries = next.widgets.find(
    (widget) => widget.type === 'SPENDING' && widget.purpose === 'GROCERIES',
  );
  const fun = next.widgets.find((widget) => widget.type === 'SPENDING' && widget.purpose === 'FUN');
  const savings = next.widgets.filter((widget) => widget.type === 'SAVINGS');
  if (
    !groceries ||
    !fun ||
    savings.length !== 1 ||
    [groceries, fun, ...savings].some((widget) => widget.rows.length !== 1)
  )
    throw new Error(
      'Auto allocation requires one Groceries, one Fun and one Savings amount. Keep additional planning rows manual.',
    );
  const amounts = new Map([
    [groceries.id, allocation.groceriesOere],
    [fun.id, allocation.funOere],
    [savings[0]!.id, allocation.savingsOere],
  ]);
  return {
    allocation,
    draft: {
      ...next,
      widgets: next.widgets.map((widget) => {
        const amount = amounts.get(widget.id);
        return amount === undefined
          ? widget
          : {
              ...widget,
              rows: widget.rows.map((row) => ({
                ...row,
                input: amountText(amount),
                confirmedAmount: amount,
              })),
            };
      }),
    },
  };
}
