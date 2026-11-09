import {
  pgTable,
  text,
  integer,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import type { BudgetPlan } from '@budget-builder/contracts';
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
