import type { BudgetPlan, BudgetTotals } from '@budget-builder/contracts';
export class AllocationError extends Error {
  constructor(public readonly code: 'AMOUNT_OVERFLOW' | 'OVER_ALLOCATED') {
    super(code);
  }
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
    allocationOere: total(p.rows.map((r) => r.amountOere)),
  }));
  const allocatedOere = total(pots.map((p) => p.allocationOere));
  return { incomeOere, allocatedOere, unallocatedOere: incomeOere - allocatedOere, pots };
}
export function validateAllocation(plan: BudgetPlan): BudgetTotals {
  const result = calculatePlan(plan);
  if (result.unallocatedOere < 0) throw new AllocationError('OVER_ALLOCATED');
  return result;
}
