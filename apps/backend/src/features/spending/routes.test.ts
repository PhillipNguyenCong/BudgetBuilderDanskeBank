import assert from 'node:assert/strict';
import { test } from 'node:test';
import request from 'supertest';
import {
  createBudgetExample,
  BudgetActivitySchema,
  SpendingSummarySchema,
} from '@budget-builder/contracts';
import { createApp } from '../../app.js';
import { JsonBankDataProvider } from '../../infrastructure/banking/json-bank-data-provider.js';
import { demoData } from '../../infrastructure/banking/demo-data.js';
import { MemoryBudgetRepository } from '../budgets/memory-repository.js';
import { MemoryCorrectionRepository } from './repository.js';

function fixture() {
  let userId = 'demo-user';
  const budgets = new MemoryBudgetRepository();
  const corrections = new MemoryCorrectionRepository((owner, id) =>
    budgets.currentRevision(owner, id),
  );
  const source = {
    ...demoData,
    meta: { generatedAt: '2026-10-15T12:00:00Z', period: { from: '2026-10-01', to: '2026-10-15' } },
    transactions: {
      isSuccess: true,
      items: [
        {
          id: 'rent',
          bookedOn: '2026-10-01',
          direction: 'DEBIT',
          amount: { value: -9000, currency: 'DKK' },
          status: 'BOOKED',
          originalTransactionText: 'Rent',
        },
        {
          id: 'shop',
          bookedOn: '2026-10-14',
          direction: 'DEBIT',
          amount: { value: -500, currency: 'DKK' },
          status: 'BOOKED',
          originalTransactionText: 'Grocery shop',
        },
        {
          id: 'refund',
          bookedOn: '2026-10-14',
          direction: 'CREDIT',
          amount: { value: 100, currency: 'DKK' },
          status: 'BOOKED',
          originalTransactionText: 'Money in',
        },
        {
          id: 'transfer',
          bookedOn: '2026-10-14',
          direction: 'DEBIT',
          amount: { value: -200, currency: 'DKK' },
          status: 'BOOKED',
          channel: 'INTERNAL_TRANSFER',
        },
      ],
    },
  };
  const bank = new JsonBankDataProvider({ load: async () => source });
  const app = createApp({ bank, budgets, corrections, identity: () => ({ userId }) });
  return {
    app,
    bank,
    budgets,
    corrections,
    source,
    setUser: (id: string) => {
      userId = id;
    },
  };
}
test('US-06: linked account snapshot, complete calculation inputs and correction/refund flow', async () => {
  const f = fixture();
  const created = (
    await request(f.app).post('/api/v1/budgets').send(createBudgetExample).expect(201)
  ).body;
  const path = `/api/v1/budgets/${created.id}`;
  const before = SpendingSummarySchema.parse(
    (await request(f.app).get(`${path}/spending`).expect(200)).body,
  );
  assert.equal(before.snapshotDate, '2026-10-15');
  assert.equal(before.overall.recordedSpendingOere, 50000);
  assert.equal(before.overall.remainingOere, 750000);
  const activity = BudgetActivitySchema.parse(
    (await request(f.app).get(`${path}/activity?limit=1`).expect(200)).body,
  );
  assert.equal(activity.page.total, 4);
  assert.equal(activity.items.length, 1);
  const all = (await request(f.app).get(`${path}/activity`).expect(200)).body.items;
  const shop = all.find(
    (a: { transaction: { sourceId: string } }) => a.transaction.sourceId === 'shop',
  );
  const refund = all.find(
    (a: { transaction: { sourceId: string } }) => a.transaction.sourceId === 'refund',
  );
  const input = {
    expectedRevision: 0,
    expectedBudgetRevision: 1,
    decision: { kind: 'TRANSFER', potId: null },
  };
  await request(f.app)
    .put(`${path}/transactions/${shop.transaction.id}/correction`)
    .send(input)
    .expect(200);
  await request(f.app)
    .put(`${path}/transactions/${shop.transaction.id}/correction`)
    .send(input)
    .expect(409);
  assert.equal(
    (await request(f.app).get(`${path}/spending`).expect(200)).body.overall.recordedSpendingOere,
    0,
  );
  await request(f.app)
    .get(`${path}/activity?expectedSnapshotVersion=${before.snapshotVersion}`)
    .expect(409);
  await request(f.app)
    .put(`${path}/transactions/${refund.transaction.id}/correction`)
    .send({ ...input, decision: { kind: 'REFUND', potId: 'spending' } })
    .expect(200);
  assert.equal(
    (await request(f.app).get(`${path}/spending`).expect(200)).body.overall.recordedSpendingOere,
    -10000,
  );
  await request(f.app)
    .put(`${path}/transactions/${shop.transaction.id}/correction`)
    .send({ ...input, expectedRevision: 1, decision: null })
    .expect(200);
  assert.equal(
    (await request(f.app).get(`${path}/spending`).expect(200)).body.overall.recordedSpendingOere,
    40000,
  );
  assert.deepEqual((await request(f.app).get(path).expect(200)).body, created);
});

test('US-06: a plan change between service validation and persistence rejects the correction atomically', async () => {
  const f = fixture();
  const budget = (
    await request(f.app).post('/api/v1/budgets').send(createBudgetExample).expect(201)
  ).body;
  const path = `/api/v1/budgets/${budget.id}`;
  const tx = (await request(f.app).get(`${path}/activity`).expect(200)).body.items[0];
  const commit = f.corrections.save.bind(f.corrections);
  f.corrections.save = async (input) => {
    await f.budgets.update(
      'demo-user',
      budget.id,
      1,
      createBudgetExample.plan,
      '2026-10-16T00:00:00Z',
    );
    return commit(input);
  };
  const failed = await request(f.app)
    .put(`${path}/transactions/${tx.transaction.id}/correction`)
    .send({
      expectedBudgetRevision: 1,
      expectedRevision: 0,
      decision: { kind: 'TRANSFER', potId: null },
    })
    .expect(409);
  assert.equal(failed.body.error.code, 'PLAN_CHANGED');
  assert.equal((await f.corrections.list('demo-user', budget.id)).length, 0);
});

test('US-10: runtime validation, ownership, plan revisions and eligible pot/direction boundaries', async () => {
  const f = fixture();
  const b = (await request(f.app).post('/api/v1/budgets').send(createBudgetExample).expect(201))
    .body;
  const path = `/api/v1/budgets/${b.id}`;
  const tx = (await request(f.app).get(`${path}/activity`).expect(200)).body.items.find(
    (a: { transaction: { sourceId: string } }) => a.transaction.sourceId === 'shop',
  );
  const input = {
    expectedRevision: 0,
    expectedBudgetRevision: 1,
    decision: { kind: 'EXPENSE', potId: 'savings' },
  };
  await request(f.app)
    .put(`${path}/transactions/${tx.transaction.id}/correction`)
    .send(input)
    .expect(422);
  await request(f.app)
    .put(`${path}/transactions/${tx.transaction.id}/correction`)
    .send({ ...input, decision: { kind: 'REFUND', potId: 'spending' } })
    .expect(422);
  await request(f.app)
    .put(`${path}/transactions/${tx.transaction.id}/correction`)
    .send({ ...input, decision: { kind: 'TRANSFER', potId: null }, expectedBudgetRevision: 2 })
    .expect(409);
  await request(f.app).get(`${path}/activity?limit=101`).expect(400);
  await request(f.app).get(`${path}/activity?month=2026-99`).expect(400);
  f.setUser('other');
  for (const suffix of ['/spending', '/activity', `/transactions/${tx.transaction.id}`])
    await request(f.app)
      .get(path + suffix)
      .expect(404);
  await request(f.app)
    .put(`${path}/transactions/${tx.transaction.id}/correction`)
    .send(input)
    .expect(404);
});

test('US-06: corrections survive identical re-imports and concurrent writes cannot overwrite', async () => {
  const f = fixture();
  const b = (await request(f.app).post('/api/v1/budgets').send(createBudgetExample).expect(201))
    .body;
  const path = `/api/v1/budgets/${b.id}`;
  const tx = (await request(f.app).get(`${path}/activity`).expect(200)).body.items[0];
  const input = {
    expectedRevision: 0,
    expectedBudgetRevision: 1,
    decision: { kind: 'TRANSFER', potId: null },
  };
  const responses = await Promise.all(
    [1, 2].map(() =>
      request(f.app).put(`${path}/transactions/${tx.transaction.id}/correction`).send(input),
    ),
  );
  assert.deepEqual(responses.map((r) => r.status).sort(), [200, 409]);
  const app = createApp({
    budgets: f.budgets,
    corrections: f.corrections,
    bank: new JsonBankDataProvider({ load: async () => structuredClone(f.source) }),
    identity: () => ({ userId: 'demo-user' }),
  });
  const reloaded = (await request(app).get(`${path}/transactions/${tx.transaction.id}`).expect(200))
    .body;
  assert.equal(reloaded.origin, 'CUSTOMER');
  assert.equal(reloaded.correctionRevision, 1);
});
