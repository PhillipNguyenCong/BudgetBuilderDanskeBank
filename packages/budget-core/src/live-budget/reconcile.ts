import type { Transaction } from '@budget-builder/contracts';

export type ReconciledTransaction = {
  transaction: Transaction;
  selected: boolean;
  conflictingSourceVersions: boolean;
  supersededBySourceVersion: boolean;
};

const identity = (transaction: Transaction) =>
  JSON.stringify([
    transaction.accountId,
    transaction.date,
    transaction.direction,
    transaction.amountOere,
    transaction.text,
    transaction.counterparty,
  ]);

const transitionPriority: Record<Transaction['status'], number> = {
  CANCELLED: 4,
  BOOKED: 3,
  PENDING: 2,
  UNKNOWN: 1,
};

/**
 * Selects one monetary source version while retaining every version for explanation and review.
 * A compatible cancelled version releases a pending commitment; a compatible booked version
 * replaces pending. Conflicting versions are never silently treated as a valid transition.
 */
export function reconcileTransactions(
  transactions: readonly Transaction[],
  accountId: string,
): ReconciledTransaction[] {
  const byId = new Map<string, Transaction>();
  const conflictingInternalIds = new Set<string>();
  for (const transaction of transactions) {
    if (transaction.accountId !== accountId) continue;
    const previous = byId.get(transaction.id);
    if (previous && JSON.stringify(previous) !== JSON.stringify(transaction))
      conflictingInternalIds.add(transaction.id);
    byId.set(transaction.id, transaction);
  }

  const groups = new Map<string, Transaction[]>();
  for (const transaction of byId.values()) {
    const key = transaction.sourceId
      ? `source:${transaction.sourceId}`
      : `record:${transaction.id}`;
    const group = groups.get(key) ?? [];
    group.push(transaction);
    groups.set(key, group);
  }

  const result: ReconciledTransaction[] = [];
  for (const group of groups.values()) {
    const compatible = new Set(group.map(identity)).size === 1;
    const selected = [...group].sort((left, right) => {
      const priority = compatible
        ? transitionPriority[right.status] - transitionPriority[left.status]
        : Number(right.status === 'BOOKED') - Number(left.status === 'BOOKED') ||
          Number(right.status === 'PENDING') - Number(left.status === 'PENDING');
      return priority || right.id.localeCompare(left.id);
    })[0]!;
    const collisionIssue = group.some((item) =>
      item.issues.some((issue) => issue.code === 'SOURCE_ID_COLLISION'),
    );
    const sourceConflict = !compatible || (group.length === 1 && collisionIssue);
    for (const transaction of group) {
      result.push({
        transaction,
        selected: transaction.id === selected.id,
        conflictingSourceVersions: sourceConflict || conflictingInternalIds.has(transaction.id),
        supersededBySourceVersion: transaction.id !== selected.id,
      });
    }
  }
  return result;
}
