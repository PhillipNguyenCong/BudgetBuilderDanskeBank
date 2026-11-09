import type { BudgetPlan } from '@budget-builder/contracts';
export interface StoredBudget {
  id: string;
  ownerId: string;
  accountId: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
  plan: BudgetPlan;
}
export interface BudgetRepository {
  list(ownerId: string): Promise<StoredBudget[]>;
  find(ownerId: string, id: string): Promise<StoredBudget | null>;
  create(budget: StoredBudget): Promise<StoredBudget>;
  update(
    ownerId: string,
    id: string,
    expectedRevision: number,
    plan: BudgetPlan,
    updatedAt: string,
  ): Promise<StoredBudget | null>;
}
export class RepositoryConflict extends Error {
  constructor(public readonly reason: 'ACCOUNT_IN_USE' | 'REVISION_CONFLICT') {
    super(reason);
  }
}
