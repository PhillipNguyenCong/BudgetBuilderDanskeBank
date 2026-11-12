import {
  pgTable,
  text,
  integer,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
  check,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import type { BudgetPlan } from '@budget-builder/contracts';
import type { TransactionDecision } from '@budget-builder/contracts';
export const budgets = pgTable(
  'budgets',
  {
    id: text('id').primaryKey(),
    ownerId: text('owner_id').notNull(),
    accountId: text('account_id').notNull(),
    revision: integer('revision').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull(),
    plan: jsonb('plan').$type<BudgetPlan>().notNull(),
  },
  (t) => [
    uniqueIndex('budgets_account_unique').on(t.accountId),
    index('budgets_owner_idx').on(t.ownerId),
    check('budgets_revision_positive', sql`${t.revision} > 0`),
    check('budgets_plan_object', sql`jsonb_typeof(${t.plan}) = 'object'`),
  ],
);

export const transactionCorrections = pgTable(
  'transaction_corrections',
  {
    ownerId: text('owner_id').notNull(),
    budgetId: text('budget_id')
      .notNull()
      .references(() => budgets.id, { onDelete: 'cascade' }),
    transactionId: text('transaction_id').notNull(),
    sourceId: text('source_id'),
    revision: integer('revision').notNull(),
    decision: jsonb('decision').$type<TransactionDecision>(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.budgetId, t.transactionId] }),
    index('transaction_corrections_owner_budget').on(t.ownerId, t.budgetId),
    check('transaction_corrections_revision_positive', sql`${t.revision} > 0`),
    check(
      'transaction_corrections_decision_object',
      sql`${t.decision} is null or jsonb_typeof(${t.decision}) = 'object'`,
    ),
  ],
);
