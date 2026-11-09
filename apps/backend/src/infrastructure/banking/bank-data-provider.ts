import type { NormalizedDataset } from '@budget-builder/budget-core';
import type { Account } from '@budget-builder/contracts';
export interface BankDataProvider {
  listAccounts(
    ownerId: string,
  ): Promise<{ items: Account[]; quality: NormalizedDataset['quality'] } | null>;
  /** Scope account snapshots by both trusted owner identity and account ID. */
  getSnapshot(ownerId: string, accountId: string): Promise<NormalizedDataset | null>;
}
