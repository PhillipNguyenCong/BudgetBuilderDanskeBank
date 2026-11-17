import type { SpendingNumbers } from '@budget-builder/contracts';

/** A zero allowance is settled only when booked bills consumed it without unresolved commitments. */
export function billStatus(numbers: SpendingNumbers): string | undefined {
  if (numbers.remainingOere !== 0 || numbers.allocationOere <= 0) return undefined;
  if (numbers.pendingSpendingOere > 0) return 'Bills pending';
  if (
    numbers.unconfirmedSpendingOere > 0 ||
    numbers.reviewAffectingCount > 0 ||
    numbers.limitations.length > 0
  )
    return 'Review bill status';
  return 'All bills are paid';
}
