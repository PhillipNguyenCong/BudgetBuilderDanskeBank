import assert from 'node:assert/strict';
import { test } from 'node:test';
import { once } from 'node:events';
import { createApp } from '../apps/backend/dist/app.js';
import { MemoryBudgetRepository } from '../apps/backend/dist/features/budgets/memory-repository.js';
import { JsonBankDataProvider } from '../apps/backend/dist/infrastructure/banking/json-bank-data-provider.js';
import { loadAccountSelection } from '../apps/mobile/src/features/budget/api/accounts.ts';
import {
  createBudget,
  listBudgets,
  loadBudgetSetup,
} from '../apps/mobile/src/features/budget/api/budgets.ts';
import { manualPlan } from '../apps/mobile/src/features/budget/editor/manualPlan.ts';

test('native feature API creates and reopens a manual budget against an isolated synthetic HTTP backend', async () => {
  const app = createApp({
    bank: new JsonBankDataProvider(),
    budgets: new MemoryBudgetRepository(),
    identity: () => ({ userId: 'demo-user' }),
    clock: () => new Date('2026-09-03T12:00:00Z'),
  });
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const previousUrl = process.env.EXPO_PUBLIC_API_URL;
  process.env.EXPO_PUBLIC_API_URL = `http://127.0.0.1:${server.address().port}`;
  try {
    const selection = await loadAccountSelection();
    assert.equal(selection.usedAccountIds.length, 0);
    const account = selection.accounts.items[0];
    const setup = await loadBudgetSetup(account.id);
    assert.equal(setup.quality.coverage.completeMonths, 2);
    const plan = manualPlan();
    plan.name = 'Synthetic manual plan';
    plan.income.rows[0].amountOere = 2400000;
    plan.pots[0].rows[0].amountOere = 800000;
    plan.pots[1].rows[0].amountOere = 1200000;
    plan.pots[2].rows[0].amountOere = 400000;
    plan.pots[0].rollover = { enabled: true, destination: 'TO_SAVINGS', targetPotId: 'savings' };
    const saved = await createBudget(account.id, plan);
    assert.deepEqual(saved.plan, plan);
    assert.equal(saved.totals.unallocatedOere, 0);
    assert.deepEqual((await listBudgets())[0], saved);
    assert.deepEqual((await loadAccountSelection()).usedAccountIds, [account.id]);
    await assert.rejects(
      createBudget(account.id, plan),
      (error) => error.code === 'ACCOUNT_IN_USE',
    );
    await assert.rejects(loadBudgetSetup(account.id), /already has a budget/);
    assert.equal((await listBudgets()).length, 1);
  } finally {
    if (previousUrl === undefined) delete process.env.EXPO_PUBLIC_API_URL;
    else process.env.EXPO_PUBLIC_API_URL = previousUrl;
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
