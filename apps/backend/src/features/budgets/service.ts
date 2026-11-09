import { randomUUID } from 'node:crypto';
import { BudgetSchema, type Budget, type BudgetPlan } from '@budget-builder/contracts';
import { validateAllocation, calculatePlan } from '@budget-builder/budget-core';
import { AccountService } from '../accounts/service.js';
import { AppError, notFound } from '../../shared/errors.js';
import { RepositoryConflict, type BudgetRepository, type StoredBudget } from './repository.js';
export class BudgetService {
  constructor(
    private readonly repository: BudgetRepository,
    private readonly accounts: AccountService,
    private readonly clock: () => Date = () => new Date(),
    private readonly id: () => string = randomUUID,
  ) {}
  private view(record: StoredBudget): Budget {
    const { ownerId: _ownerId, ...publicRecord } = record;
    return BudgetSchema.parse({ ...publicRecord, totals: calculatePlan(record.plan) });
  }
  private async owned(ownerId: string, id: string) {
    const record = await this.repository.find(ownerId, id);
    if (!record) throw notFound();
    await this.accounts.snapshot(ownerId, record.accountId);
    return record;
  }
  async list(ownerId: string) {
    const records = await this.repository.list(ownerId);
    const items = [];
    for (const r of records) {
      await this.accounts.snapshot(ownerId, r.accountId);
      items.push(this.view(r));
    }
    return { items };
  }
  async get(ownerId: string, id: string) {
    return this.view(await this.owned(ownerId, id));
  }
  async create(ownerId: string, accountId: string, plan: BudgetPlan) {
    await this.accounts.snapshot(ownerId, accountId);
    validateAllocation(plan);
    const now = this.clock().toISOString();
    return this.conflicts(async () =>
      this.view(
        await this.repository.create({
          id: this.id(),
          ownerId,
          accountId,
          plan,
          revision: 1,
          createdAt: now,
          updatedAt: now,
        }),
      ),
    );
  }
  async update(ownerId: string, id: string, expectedRevision: number, plan: BudgetPlan) {
    await this.owned(ownerId, id);
    validateAllocation(plan);
    return this.conflicts(async () => {
      const record = await this.repository.update(
        ownerId,
        id,
        expectedRevision,
        plan,
        this.clock().toISOString(),
      );
      if (!record) throw notFound();
      return this.view(record);
    });
  }
  private async conflicts<T>(action: () => Promise<T>): Promise<T> {
    try {
      return await action();
    } catch (error) {
      if (error instanceof RepositoryConflict)
        throw new AppError(
          409,
          error.reason,
          error.reason === 'ACCOUNT_IN_USE'
            ? 'This account already has a budget.'
            : 'The budget changed. Reload it before saving.',
        );
      throw error;
    }
  }
}
