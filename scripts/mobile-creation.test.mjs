import assert from 'node:assert/strict';
import { test } from 'node:test';
import { once } from 'node:events';
import { createApp } from '../apps/backend/dist/app.js';
import { MemoryBudgetRepository } from '../apps/backend/dist/features/budgets/memory-repository.js';
import { JsonBankDataProvider } from '../apps/backend/dist/infrastructure/banking/json-bank-data-provider.js';
import { loadAccountSelection } from '../apps/mobile/src/features/account-selection/api.ts';
import { createBudget, listBudgets } from '../apps/mobile/src/features/budget-shared/index.ts';
import { manualPlan, loadBudgetSetup } from '../apps/mobile/src/features/budget-creation/api.ts';
import { loadAccountBillSuggestions } from '../apps/mobile/src/features/budget-creation/api/billSuggestions.ts';
import {
  getSpendingSummary,
  getBudgetActivity,
  correctBudgetTransaction,
} from '../apps/mobile/src/features/budget-overview/api.ts';

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
    const bills = await loadAccountBillSuggestions(account.id);
    assert.equal(bills.accountId, account.id);
    assert.equal(bills.snapshotDate, '2026-09-03');
    assert.equal(bills.suggestions.find((bill) => bill.label === 'Rent').confidence, 'POSSIBLE');
    assert.equal((await listBudgets()).length, 0);
    const plan = manualPlan();
    plan.name = 'Synthetic manual plan';
    plan.income.rows[0].amountOere = 2400000;
    const spending = plan.pots.find((pot) => pot.type === 'SPENDING');
    const fixed = plan.pots.find((pot) => pot.type === 'FIXED_EXPENSE');
    const savings = plan.pots.find((pot) => pot.type === 'SAVINGS');
    spending.rows[0].amountOere = 800000;
    fixed.rows.push({
      id: 'synthetic-rent',
      label: 'Rent',
      amountOere: 1200000,
      frequency: 'MONTHLY',
    });
    savings.rows[0].amountOere = 400000;
    spending.rollover = { enabled: true, destination: 'TO_SAVINGS', targetPotId: savings.id };
    const saved = await createBudget(account.id, plan);
    assert.deepEqual(saved.plan, plan);
    assert.equal(saved.totals.unallocatedOere, 0);
    assert.deepEqual((await listBudgets())[0], saved);
    const summary = await getSpendingSummary(saved.id);
    assert.equal(summary.snapshotDate, '2026-09-03');
    assert.equal(summary.overall.remainingOere, 800000);
    assert.equal(summary.overall.weeklyGuideDkk, 2000);
    const activity = await getBudgetActivity(saved.id);
    const rent = activity.items.find((item) => item.kind === 'EXPENSE');
    assert.equal(rent.potId, fixed.id);
    const correction = await correctBudgetTransaction(
      saved.id,
      rent.transaction.id,
      0,
      saved.revision,
      { kind: 'EXPENSE', potId: spending.id },
    );
    assert.equal(correction.revision, 1);
    const overspent = await getSpendingSummary(saved.id);
    assert.equal(overspent.overall.overspentOere, 100000);
    assert.equal(overspent.overall.weeklyGuideDkk, 0);
    await correctBudgetTransaction(saved.id, rent.transaction.id, 1, saved.revision, null);
    assert.equal((await getSpendingSummary(saved.id)).overall.remainingOere, 800000);
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
