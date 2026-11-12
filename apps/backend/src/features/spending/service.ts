import {
  SpendingSummarySchema,
  TransactionCorrectionSchema,
  type ActivityQuerySchema,
  type CorrectTransactionSchema,
} from '@budget-builder/contracts';
import {
  calculateLiveBudgetSnapshot,
  remainingDays,
} from '@budget-builder/budget-core/live-budget';
import type { z } from 'zod';
import type { BudgetService } from '../budgets/service.js';
import type { AccountService } from '../accounts/service.js';
import { AppError, notFound } from '../../shared/errors.js';
import {
  BudgetRevisionConflict,
  CorrectionConflict,
  type CorrectionRepository,
} from './repository.js';
import { createHash } from 'node:crypto';

export class SpendingService {
  constructor(
    private readonly budgets: BudgetService,
    private readonly accounts: AccountService,
    private readonly corrections: CorrectionRepository,
    private readonly clock: () => Date = () => new Date(),
  ) {}
  private async view(ownerId: string, id: string) {
    const budget = await this.budgets.get(ownerId, id);
    const [data, corrections] = await Promise.all([
      this.accounts.snapshot(ownerId, budget.accountId),
      this.corrections.list(ownerId, id),
    ]);
    const parts = new Intl.DateTimeFormat('en', {
      timeZone: 'Europe/Copenhagen',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date(data.quality.asOf));
    const get = (type: string) => parts.find((p) => p.type === type)!.value;
    const sourceDate = `${get('year')}-${get('month')}-${get('day')}`;
    const date =
      data.quality.coverage.to && data.quality.coverage.to < sourceDate
        ? data.quality.coverage.to
        : sourceDate;
    const calculated = calculateLiveBudgetSnapshot({
      plan: budget.plan,
      accountId: budget.accountId,
      transactions: data.transactions,
      corrections,
      date,
      coverage: data.quality.coverage,
    });
    const snapshotVersion = createHash('sha256')
      .update(
        JSON.stringify([
          budget.id,
          budget.revision,
          date,
          data.quality,
          data.transactions,
          corrections
            .map((c) => [c.transactionId, c.revision])
            .sort((a, b) => String(a[0]).localeCompare(String(b[0]))),
        ]),
      )
      .digest('hex');
    return { budget, data, date, calculated, snapshotVersion };
  }
  async summary(ownerId: string, id: string) {
    const { budget, data, date, calculated: c, snapshotVersion } = await this.view(ownerId, id);
    return SpendingSummarySchema.parse({
      budget,
      account: data.account,
      snapshotDate: date,
      month: date.slice(0, 7),
      daysRemaining: remainingDays(date),
      mode: 'SOURCE_SNAPSHOT',
      snapshotVersion,
      quality: data.quality,
      defaultSpendingPotId: c.defaultSpendingPotId,
      retainedCorrectionCount: c.retainedCorrectionCount,
      reviewCount: c.reviewCount,
      overall: c.overall,
      pots: c.pots,
      fixedExpenses: c.fixedExpenses,
      recent: c.activity
        .filter(
          (a) =>
            a.transaction.date?.startsWith(date.slice(0, 7)) &&
            a.transaction.date <= date &&
            (a.kind === 'EXPENSE' || a.kind === 'REFUND' || a.needsReview),
        )
        .slice(0, 5),
    });
  }
  async activity(ownerId: string, id: string, query: z.infer<typeof ActivityQuerySchema>) {
    const { calculated, budget, date, snapshotVersion } = await this.view(ownerId, id);
    if (query.expectedSnapshotVersion && query.expectedSnapshotVersion !== snapshotVersion)
      throw new AppError(
        409,
        'SPENDING_CHANGED',
        'Spending inputs changed. Refresh spending and activity together.',
      );
    if (query.potId && !budget.plan.pots.some((p) => p.id === query.potId)) throw notFound();
    const items = calculated.activity.filter(
      (a) =>
        (!query.potId || a.potId === query.potId) &&
        (!query.month || a.transaction.date === null || a.transaction.date.startsWith(query.month)),
    );
    return {
      budgetRevision: budget.revision,
      snapshotVersion,
      snapshotDate: date,
      items: items.slice(query.offset, query.offset + query.limit),
      page: {
        limit: query.limit,
        offset: query.offset,
        total: items.length,
        hasMore: query.offset + query.limit < items.length,
      },
    };
  }
  async transaction(ownerId: string, id: string, transactionId: string) {
    const { calculated } = await this.view(ownerId, id);
    const found = calculated.activity.find((a) => a.transaction.id === transactionId);
    if (!found) throw notFound();
    return found;
  }
  async correct(
    ownerId: string,
    id: string,
    transactionId: string,
    input: z.infer<typeof CorrectTransactionSchema>,
  ) {
    const budget = await this.budgets.get(ownerId, id);
    if (input.expectedBudgetRevision !== budget.revision)
      throw new AppError(
        409,
        'PLAN_CHANGED',
        'The budget plan changed. Reload before correcting this transaction.',
      );
    const data = await this.accounts.snapshot(ownerId, budget.accountId);
    const tx = data.transactions.find((t) => t.id === transactionId);
    if (!tx) throw notFound();
    const d = input.decision;
    const target = budget.plan.pots.find((p) => p.id === d?.potId);
    if (
      d &&
      ((d.kind === 'EXPENSE' &&
        (tx.direction !== 'DEBIT' || !target || target.type === 'SAVINGS')) ||
        (d.kind === 'REFUND' &&
          (tx.direction !== 'CREDIT' || !target || target.type === 'SAVINGS')) ||
        (d.kind === 'CREDIT' && tx.direction !== 'CREDIT'))
    )
      throw new AppError(
        422,
        'INVALID_ASSIGNMENT',
        'The transaction direction or target pot is not eligible.',
      );
    try {
      const saved = await this.corrections.save({
        ownerId,
        budgetId: id,
        transactionId,
        sourceId: tx.sourceId,
        expectedRevision: input.expectedRevision,
        expectedBudgetRevision: input.expectedBudgetRevision,
        decision: input.decision,
        updatedAt: this.clock().toISOString(),
      });
      return TransactionCorrectionSchema.parse({
        transactionId: saved.transactionId,
        revision: saved.revision,
        decision: saved.decision,
        updatedAt: saved.updatedAt,
      });
    } catch (error) {
      if (error instanceof BudgetRevisionConflict)
        throw new AppError(
          409,
          'PLAN_CHANGED',
          'The budget plan changed. Reload before correcting this transaction.',
        );
      if (error instanceof CorrectionConflict)
        throw new AppError(
          409,
          'CORRECTION_CONFLICT',
          'This classification changed. Reload before trying again.',
        );
      throw error;
    }
  }
}
