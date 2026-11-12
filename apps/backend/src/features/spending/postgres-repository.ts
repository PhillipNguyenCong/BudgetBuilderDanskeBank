import { sql } from 'drizzle-orm';
import { TransactionCorrectionSchema } from '@budget-builder/contracts';
import type { QueryRunner } from '../budgets/postgres-repository.js';
import {
  CorrectionConflict,
  BudgetRevisionConflict,
  type CorrectionRepository,
  type StoredCorrection,
} from './repository.js';
const defaultRunner: QueryRunner = async (query) => {
  const { getDatabase } = await import('../../infrastructure/database/client.js');
  return (await getDatabase().execute(query)).rows as Record<string, unknown>[];
};
function record(row: Record<string, unknown>): StoredCorrection {
  return {
    ...TransactionCorrectionSchema.parse({
      transactionId: row.transaction_id,
      revision: row.revision,
      decision: row.decision,
      updatedAt: new Date(String(row.updated_at)).toISOString(),
    }),
    ownerId: String(row.owner_id),
    budgetId: String(row.budget_id),
    sourceId: row.source_id === null ? null : String(row.source_id),
  };
}
export class PostgresCorrectionRepository implements CorrectionRepository {
  constructor(private readonly run: QueryRunner = defaultRunner) {}
  async list(ownerId: string, budgetId: string) {
    return (
      await this.run(
        sql`select * from transaction_corrections where owner_id = ${ownerId} and budget_id = ${budgetId}`,
      )
    ).map(record);
  }
  async save(input: Parameters<CorrectionRepository['save']>[0]) {
    const i = input;
    const decision = i.decision === null ? null : JSON.stringify(i.decision);
    const rows = await this.run(
      i.expectedRevision === 0
        ? sql`with owned_budget as (select id from budgets where id = ${i.budgetId} and owner_id = ${i.ownerId} and revision = ${i.expectedBudgetRevision} for update) insert into transaction_corrections (owner_id,budget_id,transaction_id,source_id,revision,decision,updated_at) select ${i.ownerId},${i.budgetId},${i.transactionId},${i.sourceId},1,${decision}::jsonb,${i.updatedAt} from owned_budget where true on conflict (budget_id,transaction_id) do nothing returning *`
        : sql`with owned_budget as (select id from budgets where id = ${i.budgetId} and owner_id = ${i.ownerId} and revision = ${i.expectedBudgetRevision} for update) update transaction_corrections t set decision = ${decision}::jsonb, revision = t.revision + 1, updated_at = ${i.updatedAt} from owned_budget b where t.owner_id = ${i.ownerId} and t.budget_id = b.id and t.transaction_id = ${i.transactionId} and t.revision = ${i.expectedRevision} returning t.*`,
    );
    if (!rows[0]) {
      const current = await this.run(
        sql`select revision from budgets where id = ${i.budgetId} and owner_id = ${i.ownerId}`,
      );
      if (Number(current[0]?.revision) !== i.expectedBudgetRevision)
        throw new BudgetRevisionConflict();
      throw new CorrectionConflict();
    }
    return record(rows[0]);
  }
}
