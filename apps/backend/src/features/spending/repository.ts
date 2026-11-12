import type { TransactionCorrection, TransactionDecision } from '@budget-builder/contracts';
export type StoredCorrection = TransactionCorrection & {
  ownerId: string;
  budgetId: string;
  sourceId: string | null;
};
export interface CorrectionRepository {
  list(ownerId: string, budgetId: string): Promise<StoredCorrection[]>;
  save(input: {
    ownerId: string;
    budgetId: string;
    transactionId: string;
    sourceId: string | null;
    expectedRevision: number;
    expectedBudgetRevision: number;
    decision: TransactionDecision | null;
    updatedAt: string;
  }): Promise<StoredCorrection>;
}
export class CorrectionConflict extends Error {}
export class BudgetRevisionConflict extends Error {}
export class MemoryCorrectionRepository implements CorrectionRepository {
  private readonly records = new Map<string, StoredCorrection>();
  constructor(
    private readonly budgetRevision: (ownerId: string, budgetId: string) => number | null,
  ) {}
  async list(ownerId: string, budgetId: string) {
    return structuredClone(
      [...this.records.values()].filter((r) => r.ownerId === ownerId && r.budgetId === budgetId),
    );
  }
  async save(input: Parameters<CorrectionRepository['save']>[0]) {
    if (this.budgetRevision(input.ownerId, input.budgetId) !== input.expectedBudgetRevision)
      throw new BudgetRevisionConflict();
    const key = JSON.stringify([input.budgetId, input.transactionId]);
    const current = this.records.get(key);
    if (
      (current && current.ownerId !== input.ownerId) ||
      (current?.revision ?? 0) !== input.expectedRevision
    )
      throw new CorrectionConflict();
    const { expectedRevision, expectedBudgetRevision: _expectedBudgetRevision, ...fields } = input;
    const record = { ...fields, revision: expectedRevision + 1 };
    this.records.set(key, structuredClone(record));
    return structuredClone(record);
  }
}
