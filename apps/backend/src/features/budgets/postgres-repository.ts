import { sql, type SQL } from 'drizzle-orm';
import { BudgetPlanSchema, type BudgetPlan } from '@budget-builder/contracts';
import { RepositoryConflict, type BudgetRepository, type StoredBudget } from './repository.js';
export type QueryRunner = (query: SQL) => Promise<Record<string, unknown>[]>;
const defaultRunner: QueryRunner = async (query) => {
  const { getDatabase } = await import('../../infrastructure/database/client.js');
  const result = await getDatabase().execute(query);
  return result.rows as Record<string, unknown>[];
};
function record(row: Record<string, unknown>): StoredBudget {
  return {
    id: String(row.id),
    ownerId: String(row.owner_id),
    accountId: String(row.account_id),
    revision: Number(row.revision),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
    plan: BudgetPlanSchema.parse(row.plan),
  };
}
function pgError(error: unknown): { code: string; constraint?: string } | null {
  let e: unknown = error;
  for (let i = 0; i < 5 && e && typeof e === 'object'; i++) {
    const r = e as { code?: unknown; constraint?: unknown; cause?: unknown };
    if (typeof r.code === 'string')
      return {
        code: r.code,
        ...(typeof r.constraint === 'string' ? { constraint: r.constraint } : {}),
      };
    e = r.cause;
  }
  return null;
}
export class PostgresBudgetRepository implements BudgetRepository {
  constructor(private readonly run: QueryRunner = defaultRunner) {}
  async list(ownerId: string) {
    return (await this.run(sql`select * from budgets where owner_id = ${ownerId} order by id`)).map(
      record,
    );
  }
  async find(ownerId: string, id: string) {
    const rows = await this.run(
      sql`select * from budgets where id = ${id} and owner_id = ${ownerId}`,
    );
    return rows[0] ? record(rows[0]) : null;
  }
  async create(b: StoredBudget) {
    try {
      const rows = await this.run(
        sql`insert into budgets (id,owner_id,account_id,revision,created_at,updated_at,plan) values (${b.id},${b.ownerId},${b.accountId},${b.revision},${b.createdAt},${b.updatedAt},${JSON.stringify(b.plan)}::jsonb) returning *`,
      );
      if (!rows[0]) throw new Error('Insert returned no row');
      return record(rows[0]);
    } catch (error) {
      const info = pgError(error);
      if (info?.code === '23505' && info.constraint === 'budgets_account_unique')
        throw new RepositoryConflict('ACCOUNT_IN_USE');
      throw error;
    }
  }
  async update(
    ownerId: string,
    id: string,
    expectedRevision: number,
    plan: BudgetPlan,
    updatedAt: string,
  ) {
    const rows = await this.run(
      sql`update budgets set plan = ${JSON.stringify(plan)}::jsonb, revision = revision + 1, updated_at = ${updatedAt} where id = ${id} and owner_id = ${ownerId} and revision = ${expectedRevision} returning *`,
    );
    if (rows[0]) return record(rows[0]);
    if (await this.find(ownerId, id)) throw new RepositoryConflict('REVISION_CONFLICT');
    return null;
  }
}
