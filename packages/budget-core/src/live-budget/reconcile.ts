import type { Transaction } from '@budget-builder/contracts';

export type ReconciledTransaction = {
  transaction: Transaction;
  selected: boolean;
  conflictingSourceVersions: boolean;
  supersededBySourceVersion: boolean;
  resolvedMonth?: string;
  releasedMonth?: string;
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
    const pending = group.filter((tx) => tx.status === 'PENDING');
    const terminal = group.filter((tx) => tx.status === 'BOOKED' || tx.status === 'CANCELLED');
    const transition =
      group.length === 2 &&
      pending.length === 1 &&
      terminal.length === 1 &&
      pending[0]!.date !== null &&
      terminal[0]!.date !== null &&
      pending[0]!.date! <= terminal[0]!.date! &&
      pending[0]!.amountOere !== null &&
      JSON.stringify([
        pending[0]!.accountId,
        pending[0]!.direction,
        pending[0]!.amountOere,
        pending[0]!.text,
        pending[0]!.counterparty,
      ]) ===
        JSON.stringify([
          terminal[0]!.accountId,
          terminal[0]!.direction,
          terminal[0]!.amountOere,
          terminal[0]!.text,
          terminal[0]!.counterparty,
        ]);
    const compatible = transition || new Set(group.map(identity)).size === 1;
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
        ...(transition && transaction.status === 'PENDING'
          ? terminal[0]!.status === 'BOOKED'
            ? { resolvedMonth: terminal[0]!.date!.slice(0, 7) }
            : { releasedMonth: terminal[0]!.date!.slice(0, 7) }
          : {}),
      });
    }
  }
  return result;
}
