import assert from 'node:assert/strict';
import { test } from 'node:test';
import { once } from 'node:events';
import { createApp } from '../apps/backend/dist/app.js';
import { MemoryBudgetRepository } from '../apps/backend/dist/features/budgets/memory-repository.js';
import { JsonBankDataProvider } from '../apps/backend/dist/infrastructure/banking/json-bank-data-provider.js';
import { loadAccountSelection } from '../apps/mobile/src/features/account-selection/api.ts';
import { createBudget, listBudgets } from '../apps/mobile/src/features/budget-shared/data.ts';
import {
  manualPlan,
  loadBudgetSetup,
  loadSalarySuggestion,
} from '../apps/mobile/src/features/budget-creation/api.ts';
import { loadAccountBillSuggestions } from '../apps/mobile/src/features/budget-creation/api/billSuggestions.ts';
import {
  createAutoAllocationDraft,
  prepareAutoBills,
  createCarChecklist,
  applyCarChecklist,
  createDraft,
  validateDraft,
} from '../apps/mobile/src/features/budget-editor/api.ts';
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
    const salary = await loadSalarySuggestion(account.id);
    assert.equal(salary.accountId, account.id);
    assert.equal(salary.snapshotDate, '2026-09-03');
    const bills = await loadAccountBillSuggestions(account.id);
    assert.equal(bills.accountId, account.id);
    assert.equal(bills.snapshotDate, '2026-09-03');
    assert.equal(bills.suggestions.find((bill) => bill.label === 'Rent').confidence, 'POSSIBLE');
    assert.ok(bills.suggestions.some((bill) => bill.frequency === null));
    const autoDraft = createDraft(manualPlan());
    autoDraft.name = 'Monthly default draft';
    autoDraft.widgets[0].rows[0].input = '24000';
    const automatic = validateDraft(createAutoAllocationDraft(autoDraft, bills, []).draft);
    assert.equal(automatic.error, undefined);
    assert.equal(automatic.totals.unallocatedOere, 0);
    assert.ok(
      automatic.plan.pots
        .find((pot) => pot.type === 'FIXED_EXPENSE')
        .rows.some(
          (row) => row.originalSuggestion.frequency === null && row.frequency === 'MONTHLY',
        ),
    );
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
    await assert.rejects(() => getSpendingSummary(saved.id, undefined, '2026-08'));
    const summary = await getSpendingSummary(saved.id);
    assert.equal(summary.snapshotDate, '2026-09-03');
    assert.equal(summary.overall.remainingOere, 800000);
    assert.equal(summary.overall.weeklyGuideDkk, 2000);
    const activity = await getBudgetActivity(saved.id);
    const accountActivity = await getBudgetActivity(saved.id, {
      range: 'account',
      limit: 5,
      expectedSnapshotVersion: summary.snapshotVersion,
    });
    assert.equal(accountActivity.page.limit, 5);
    assert.ok(accountActivity.items.some((item) => item.transaction.date < '2026-09-01'));
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

test('auto budget discovers bills, persists two spending purposes and reopens their separate guides', async () => {
  const source = {
    meta: { generatedAt: '2026-09-15T12:00:00Z', period: { from: '2026-07-01', to: '2026-09-15' } },
    account: { id: 'auto-account', name: 'Synthetic auto account', currency: 'DKK' },
    transactions: {
      isSuccess: true,
      items: [
        {
          id: 'salary',
          bookedOn: '2026-08-31',
          direction: 'CREDIT',
          amount: { value: 20000, currency: 'DKK' },
          status: 'BOOKED',
          originalTransactionText: 'Salary',
        },
        ...['07', '08', '09'].map((month) => ({
          id: `rent-${month}`,
          bookedOn: `2026-${month}-01`,
          direction: 'DEBIT',
          amount: { value: -13000, currency: 'DKK' },
          status: 'BOOKED',
          originalTransactionText: 'Rent',
        })),
        {
          id: 'food',
          bookedOn: '2026-09-03',
          direction: 'DEBIT',
          amount: { value: -100, currency: 'DKK' },
          status: 'BOOKED',
          originalTransactionText: 'Groceries',
        },
        {
          id: 'cinema',
          bookedOn: '2026-09-03',
          direction: 'DEBIT',
          amount: { value: -200, currency: 'DKK' },
          status: 'BOOKED',
          originalTransactionText: 'Cinema',
        },
      ],
    },
    payments: { isSuccess: true, items: [] },
  };
  const app = createApp({
    bank: new JsonBankDataProvider({ load: async () => source }),
    budgets: new MemoryBudgetRepository(),
    identity: () => ({ userId: 'demo-user' }),
    clock: () => new Date('2026-09-15T12:00:00Z'),
  });
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const previousUrl = process.env.EXPO_PUBLIC_API_URL;
  process.env.EXPO_PUBLIC_API_URL = `http://127.0.0.1:${server.address().port}`;
  try {
    const account = (await loadAccountSelection()).accounts.items[0];
    const salary = await loadSalarySuggestion(account.id);
    assert.equal(salary.suggestion.amountOere, 2000000);
    const bills = await loadAccountBillSuggestions(account.id);
    assert.equal(bills.suggestions.length, 1);
    const draft = createDraft(manualPlan());
    draft.name = 'Synthetic auto budget';
    draft.widgets[0].rows[0].input = String(salary.suggestion.amountOere / 100);
    const prepared = prepareAutoBills(draft, bills, []);
    const carCosts = createCarChecklist(prepared).map((item) => ({
      ...item,
      include: item.kind === 'INSPECTION',
      row: { ...item.row, input: '100' },
    }));
    const result = createAutoAllocationDraft(applyCarChecklist(prepared, carCosts), bills, []);
    assert.equal(result.allocation.split, '85/5/10');
    assert.equal((await listBudgets()).length, 0);
    const accepted = validateDraft(result.draft);
    assert.equal(accepted.error, undefined);
    assert.equal(accepted.totals.unallocatedOere, 0);
    const saved = await createBudget(account.id, accepted.plan);
    assert.deepEqual(saved.plan, accepted.plan);
    const inspection = saved.plan.pots
      .find((pot) => pot.type === 'FIXED_EXPENSE')
      .rows.find((row) => row.carExpense?.kind === 'INSPECTION');
    assert.equal(inspection.amountOere, 10000);
    assert.equal(inspection.frequency, 'MONTHLY');
    assert.equal(inspection.carExpense.basis, 'MONTHLY_RESERVE');
    assert.deepEqual((await listBudgets())[0], saved);
    assert.deepEqual(
      saved.plan.pots.filter((pot) => pot.type === 'SPENDING').map((pot) => pot.purpose),
      ['GROCERIES', 'FUN'],
    );
    const summary = await getSpendingSummary(saved.id);
    const food = saved.plan.pots.find((pot) => pot.purpose === 'GROCERIES');
    const fun = saved.plan.pots.find((pot) => pot.purpose === 'FUN');
    assert.equal(summary.pots.find((pot) => pot.potId === food.id).numbers.remainingOere, 380000);
    assert.equal(summary.pots.find((pot) => pot.potId === fun.id).numbers.remainingOere, 80000);
    const activity = await getBudgetActivity(saved.id);
    assert.equal(activity.items.find((item) => item.transaction.text === 'Cinema').potId, fun.id);
    assert.equal(
      activity.items.find((item) => item.transaction.text === 'Groceries').potId,
      food.id,
    );
  } finally {
    if (previousUrl === undefined) delete process.env.EXPO_PUBLIC_API_URL;
    else process.env.EXPO_PUBLIC_API_URL = previousUrl;
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
