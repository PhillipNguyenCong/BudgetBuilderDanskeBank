import type { BudgetPlan } from '@budget-builder/contracts';
import { RepositoryConflict, type BudgetRepository, type StoredBudget } from './repository.js';
export class MemoryBudgetRepository implements BudgetRepository {
  private readonly records = new Map<string, StoredBudget>();
  /** Synchronous guard used in the same JS turn as a memory correction commit. */
  currentRevision(ownerId: string, id: string): number | null {
    const budget = this.records.get(id);
    return budget?.ownerId === ownerId ? budget.revision : null;
  }
  async list(ownerId: string) {
    return structuredClone(
      [...this.records.values()]
        .filter((b) => b.ownerId === ownerId)
        .sort((a, b) => a.id.localeCompare(b.id)),
    );
  }
  async find(ownerId: string, id: string) {
    const b = this.records.get(id);
    return b?.ownerId === ownerId ? structuredClone(b) : null;
  }
  async create(budget: StoredBudget) {
    if ([...this.records.values()].some((b) => b.accountId === budget.accountId))
      throw new RepositoryConflict('ACCOUNT_IN_USE');
    this.records.set(budget.id, structuredClone(budget));
    return structuredClone(budget);
  }
  async update(ownerId: string, id: string, revision: number, plan: BudgetPlan, updatedAt: string) {
    const b = this.records.get(id);
    if (!b || b.ownerId !== ownerId) return null;
    if (b.revision !== revision) throw new RepositoryConflict('REVISION_CONFLICT');
    const next = { ...b, plan: structuredClone(plan), revision: revision + 1, updatedAt };
    this.records.set(id, next);
    return structuredClone(next);
  }
}
