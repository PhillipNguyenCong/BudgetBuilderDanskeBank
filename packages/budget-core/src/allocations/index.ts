import type { BudgetPlan, BudgetTotals, BillFrequency } from '@budget-builder/contracts';
export class AllocationError extends Error {
  constructor(public readonly code: 'AMOUNT_OVERFLOW' | 'OVER_ALLOCATED') {
    super(code);
  }
}
const frequencyMonths = { MONTHLY: 1n, QUARTERLY: 3n, HALF_YEARLY: 6n, YEARLY: 12n } as const;
/** Round each bill up to the nearest oere; never modify its payment amount. */
export function monthlyBillAllocation(
  amountOere: number,
  frequency: BillFrequency = 'MONTHLY',
): number {
  if (!Number.isSafeInteger(amountOere) || amountOere < 0)
    throw new AllocationError('AMOUNT_OVERFLOW');
  const divisor = frequencyMonths[frequency];
  if (!divisor) throw new Error('INVALID_BILL_FREQUENCY');
  return Number((BigInt(amountOere) + divisor - 1n) / divisor);
}
function total(values: number[]): number {
  const result = values.reduce((sum, v) => sum + BigInt(v), 0n);
  if (result > BigInt(Number.MAX_SAFE_INTEGER)) throw new AllocationError('AMOUNT_OVERFLOW');
  return Number(result);
}
export function calculatePlan(plan: BudgetPlan): BudgetTotals {
  const incomeOere = total(plan.income.rows.map((r) => r.amountOere));
  const pots = plan.pots.map((p) => ({
    id: p.id,
    allocationOere: total(
      p.type === 'FIXED_EXPENSE'
        ? p.rows.map((r) => monthlyBillAllocation(r.amountOere, r.frequency))
        : p.rows.map((r) => r.amountOere),
    ),
  }));
  const allocatedOere = total(pots.map((p) => p.allocationOere));
  return { incomeOere, allocatedOere, unallocatedOere: incomeOere - allocatedOere, pots };
}
export function validateAllocation(plan: BudgetPlan): BudgetTotals {
  const result = calculatePlan(plan);
  if (result.unallocatedOere < 0) throw new AllocationError('OVER_ALLOCATED');
  return result;
}

export type DraftAmount = number | null | 'invalid';
export type PotProgress = {
  id: string;
  status: 'complete' | 'not-entered' | 'incomplete' | 'invalid';
};
export type AllocationProgress = { pots: PotProgress[] } & (
  | {
      status: 'ready';
      incomeOere: number;
      enteredAllocationOere: number;
      remainingOere: number;
      missingPotAmounts: number;
    }
  | { status: 'income-incomplete' | 'invalid' | 'overflow' }
);
/** Missing values stay missing: the remainder describes entered allocations only. */
export function calculateAllocationProgress(
  income: readonly DraftAmount[],
  pots: readonly { id: string; amounts: readonly DraftAmount[] }[],
): AllocationProgress {
  const invalid = (amount: DraftAmount) =>
    amount !== null && (typeof amount !== 'number' || !Number.isSafeInteger(amount) || amount < 0);
  const progress: PotProgress[] = pots.map(({ id, amounts }) => ({
    id,
    status: amounts.some(invalid)
      ? 'invalid'
      : amounts.length > 0 && amounts.every((amount) => amount === null)
        ? 'not-entered'
        : amounts.some((amount) => amount === null)
          ? 'incomplete'
          : 'complete',
  }));
  if (income.some(invalid) || progress.some((pot) => pot.status === 'invalid')) {
    return { status: 'invalid', pots: progress };
  }
  if (!income.length || income.some((amount) => amount === null)) {
    return { status: 'income-incomplete', pots: progress };
  }
  const amounts = pots.flatMap((pot) => pot.amounts);
  const numbers = (values: readonly DraftAmount[]) =>
    values.filter((value): value is number => typeof value === 'number');
  try {
    const incomeOere = total(numbers(income));
    const enteredAllocationOere = total(numbers(amounts));
    return {
      status: 'ready',
      pots: progress,
      incomeOere,
      enteredAllocationOere,
      remainingOere: incomeOere - enteredAllocationOere,
      missingPotAmounts: amounts.filter((amount) => amount === null).length,
    };
  } catch (error) {
    if (!(error instanceof AllocationError)) throw error;
    return { status: 'overflow', pots: progress };
  }
}

/** Review a residual allocation without choosing priorities or mutating the plan. */
export function proposeSavingsUpdate(plan: BudgetPlan, potId: string, rowId: string) {
  const pot = plan.pots.find((item) => item.id === potId && item.type === 'SAVINGS');
  const row = pot?.rows.find((item) => item.id === rowId);
  if (!pot || !row) throw new Error('INVALID_SAVINGS_ROW');
  const totals = calculatePlan(plan);
  const afterOere = row.amountOere + totals.unallocatedOere;
  if (afterOere < 0) throw new Error('INSUFFICIENT_CAPACITY');
  if (!Number.isSafeInteger(afterOere)) throw new AllocationError('AMOUNT_OVERFLOW');
  const beforePotOere = totals.pots.find((item) => item.id === potId)!.allocationOere;
  return {
    potId,
    rowId,
    beforeOere: row.amountOere,
    afterOere,
    beforePotOere,
    afterPotOere: beforePotOere + totals.unallocatedOere,
  };
}
