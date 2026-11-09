import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PgDialect } from 'drizzle-orm/pg-core';
import { createBudgetExample } from '@budget-builder/contracts';
import { PostgresBudgetRepository } from './postgres-repository.js';
import { RepositoryConflict, type StoredBudget } from './repository.js';
const budget: StoredBudget = {
  id: 'budget-a',
  ownerId: 'owner',
  accountId: 'demo-account',
  revision: 1,
  createdAt: '2026-09-03T12:00:00.000Z',
  updatedAt: '2026-09-03T12:00:00.000Z',
  plan: createBudgetExample.plan,
};
const row = {
  id: budget.id,
  owner_id: budget.ownerId,
  account_id: budget.accountId,
  revision: 1,
  created_at: budget.createdAt,
  updated_at: budget.updatedAt,
  plan: budget.plan,
};
const dialect = new PgDialect();
test('insert is parameterized and maps persisted records', async () => {
  const repo = new PostgresBudgetRepository(async (q) => {
    const built = dialect.sqlToQuery(q);
    assert.match(built.sql, /insert into budgets/);
    assert.ok(!built.sql.includes('My budget'));
    assert.ok(built.params.includes(JSON.stringify(budget.plan)));
    return [row];
  });
  assert.deepEqual(await repo.create(budget), budget);
});
test('unique account violations are mapped; unrelated errors remain errors', async () => {
  const repo = new PostgresBudgetRepository(async () => {
    throw { cause: { code: '23505', constraint: 'budgets_account_unique' } };
  });
  await assert.rejects(
    repo.create(budget),
    (e) => e instanceof RepositoryConflict && e.reason === 'ACCOUNT_IN_USE',
  );
  const failed = new PostgresBudgetRepository(async () => {
    throw new Error('database unavailable');
  });
  await assert.rejects(failed.create(budget), /database unavailable/);
});
test('revision check and owner scope are part of a single atomic update', async () => {
  const repo = new PostgresBudgetRepository(async (q) => {
    const built = dialect.sqlToQuery(q);
    assert.match(built.sql, /revision = revision \+ 1/);
    assert.match(built.sql, /owner_id = \$\d+ and revision = \$\d+/);
    assert.ok(built.params.includes(1));
    return [{ ...row, revision: 2 }];
  });
  assert.equal(
    (await repo.update('owner', 'budget-a', 1, budget.plan, budget.updatedAt))!.revision,
    2,
  );
});
test('failed revision updates distinguish conflict from absent owner-visible record', async () => {
  let calls = 0;
  const repo = new PostgresBudgetRepository(async () => (++calls === 1 ? [] : [row]));
  await assert.rejects(
    repo.update('owner', 'budget-a', 1, budget.plan, budget.updatedAt),
    (e) => e instanceof RepositoryConflict && e.reason === 'REVISION_CONFLICT',
  );
  const absent = new PostgresBudgetRepository(async () => []);
  assert.equal(await absent.update('other', 'budget-a', 1, budget.plan, budget.updatedAt), null);
});
