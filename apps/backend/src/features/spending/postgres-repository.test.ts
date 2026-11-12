import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PgDialect } from 'drizzle-orm/pg-core';
import { PostgresCorrectionRepository } from './postgres-repository.js';
import { BudgetRevisionConflict, CorrectionConflict } from './repository.js';
const dialect = new PgDialect();
test('correction writes are parameterized, owner-scoped and optimistic/atomic', async () => {
  const input = {
    ownerId: 'owner',
    budgetId: 'budget',
    transactionId: 'tx',
    sourceId: 'source',
    expectedRevision: 0,
    expectedBudgetRevision: 1,
    decision: { kind: 'TRANSFER' as const, potId: null },
    updatedAt: '2026-10-15T12:00:00Z',
  };
  const repo = new PostgresCorrectionRepository(async (query) => {
    const built = dialect.sqlToQuery(query);
    assert.ok(!built.sql.includes("owner'"));
    assert.ok(built.params.includes('owner'));
    assert.match(built.sql, /for update/);
    assert.match(built.sql, /on conflict \(budget_id,transaction_id\) do nothing/);
    return [
      {
        owner_id: 'owner',
        budget_id: 'budget',
        transaction_id: 'tx',
        source_id: 'source',
        revision: 1,
        decision: input.decision,
        updated_at: input.updatedAt,
      },
    ];
  });
  assert.equal((await repo.save(input)).revision, 1);
  const stale = new PostgresCorrectionRepository(async (query) => {
    if (dialect.sqlToQuery(query).sql.startsWith('select revision')) return [{ revision: 1 }];
    assert.match(
      dialect.sqlToQuery(query).sql,
      /t.owner_id = .*t.budget_id = b.id and t.transaction_id = .*t.revision =/,
    );
    return [];
  });
  await assert.rejects(stale.save({ ...input, expectedRevision: 1 }), CorrectionConflict);
  const changedPlan = new PostgresCorrectionRepository(async (query) =>
    dialect.sqlToQuery(query).sql.startsWith('select revision') ? [{ revision: 2 }] : [],
  );
  await assert.rejects(changedPlan.save(input), BudgetRevisionConflict);
});
