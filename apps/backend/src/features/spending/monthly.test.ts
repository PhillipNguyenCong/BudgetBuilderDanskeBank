import assert from 'node:assert/strict';
import { test } from 'node:test';
import request from 'supertest';
import { createBudgetExample, SpendingSummarySchema } from '@budget-builder/contracts';
import { createApp } from '../../app.js';
import { JsonBankDataProvider } from '../../infrastructure/banking/json-bank-data-provider.js';
import { demoData } from '../../infrastructure/banking/demo-data.js';
import { MemoryBudgetRepository } from '../budgets/memory-repository.js';

test('US-06/12: monthly reads isolate pending bills, resolve cross-month bookings and separate undated review', async () => {
  const movement = (
    id: string,
    date: string | null,
    amount: number,
    text: string,
    status = 'PENDING',
  ) => ({
    id,
    bookedOn: date,
    direction: 'DEBIT',
    amount: { value: -amount, currency: 'DKK' },
    originalTransactionText: text,
    status,
  });
  const bank = new JsonBankDataProvider({
    load: async () => ({
      ...demoData,
      meta: {
        generatedAt: '2026-09-03T12:00:00Z',
        period: { from: '2026-08-01', to: '2026-09-03' },
      },
      transactions: {
        items: [
          movement('aug-rent', '2026-08-01', 8500, 'Rent'),
          movement('sep-rent', '2026-09-01', 8500, 'Rent'),
          movement('settlement', '2026-08-28', 100, 'Shop'),
          movement('settlement', '2026-09-02', 100, 'Shop', 'BOOKED'),
          movement('undated', null, 50, 'Rent'),
        ],
      },
    }),
  });
  let now = new Date('2026-08-01T12:00:00Z');
  const app = createApp({
    bank,
    clock: () => now,
    budgets: new MemoryBudgetRepository(),
    identity: () => ({ userId: 'demo-user' }),
  });
  const created = (await request(app).post('/api/v1/budgets').send(createBudgetExample).expect(201))
    .body;
  now = new Date('2026-09-03T12:00:00Z');
  const path = `/api/v1/budgets/${created.id}`;
  const september = SpendingSummarySchema.parse(
    (await request(app).get(`${path}/spending`).expect(200)).body,
  );
  assert.deepEqual(september.availableMonths, ['2026-08', '2026-09']);
  assert.equal(september.month, '2026-09');
  assert.equal(september.fixedExpenses[0]!.numbers.pendingSpendingOere, 850000);
  assert.equal(september.fixedExpenses[0]!.numbers.remainingOere, 350000);
  assert.equal(september.overall.recordedSpendingOere, 10000);
  assert.equal(september.undatedReviewCount, 1);
  const august = SpendingSummarySchema.parse(
    (await request(app).get(`${path}/spending?month=2026-08`).expect(200)).body,
  );
  assert.equal(august.month, '2026-08');
  assert.equal(august.snapshotDate, '2026-08-31');
  assert.equal(august.sourceSnapshotDate, '2026-09-03');
  assert.equal(august.fixedExpenses[0]!.numbers.pendingSpendingOere, 850000);
  assert.equal(august.overall.recordedSpendingOere, 0);
  assert.notEqual(august.snapshotVersion, september.snapshotVersion);
  const activity = (
    await request(app)
      .get(`${path}/activity?month=2026-08&expectedSnapshotVersion=${august.snapshotVersion}`)
      .expect(200)
  ).body;
  assert.ok(
    activity.items.every((item: { transaction: { date: string } }) =>
      item.transaction.date?.startsWith('2026-08'),
    ),
  );
  assert.ok(
    activity.items.some((item: { exclusionReason: string }) =>
      item.exclusionReason?.startsWith('Booked in 2026-09'),
    ),
  );
  const pendingAugust = activity.items.find(
    (item: { transaction: { text: string } }) => item.transaction.text === 'Rent',
  );
  const classification = (
    await request(app)
      .get(`${path}/transactions/${pendingAugust.transaction.id}?month=2026-08`)
      .expect(200)
  ).body;
  assert.equal(classification.contribution, 'PENDING');
  const undated = (
    await request(app)
      .get(
        `${path}/activity?month=2026-08&review=undated&expectedSnapshotVersion=${august.snapshotVersion}`,
      )
      .expect(200)
  ).body;
  assert.equal(undated.items.length, 1);
  assert.equal(undated.items[0].transaction.date, null);
  assert.equal(undated.items[0].contribution, 'NONE');
  await request(app)
    .get(`${path}/activity?month=2026-08&expectedSnapshotVersion=${september.snapshotVersion}`)
    .expect(409);
  await request(app).get(`${path}/spending?month=2026-13`).expect(400);
  await request(app).get(`${path}/spending?month=2026-10`).expect(400);
  await request(app).get(`${path}/spending?month=2026-07`).expect(400);
});

test('US-06/12: the log starts at creation, advances with the calendar and rejects older imported months', async () => {
  let now = new Date('2026-11-12T12:00:00Z');
  const app = createApp({
    bank: new JsonBankDataProvider(),
    budgets: new MemoryBudgetRepository(),
    identity: () => ({ userId: 'demo-user' }),
    clock: () => now,
  });
  const budget = (await request(app).post('/api/v1/budgets').send(createBudgetExample).expect(201))
    .body;
  const path = `/api/v1/budgets/${budget.id}`;
  const first = SpendingSummarySchema.parse(
    (await request(app).get(`${path}/spending`).expect(200)).body,
  );
  assert.equal(first.startMonth, '2026-11');
  assert.equal(first.currentMonth, '2026-11');
  assert.equal(first.month, '2026-11');
  assert.equal(first.sourceSnapshotDate, '2026-09-03');
  assert.deepEqual(first.availableMonths, ['2026-11']);
  assert.equal(first.overall.recordedSpendingOere, 0);
  assert.ok(
    first.overall.limitations.some((message) =>
      message.includes('No source data covers this month'),
    ),
  );
  await request(app).get(`${path}/spending?month=2026-08`).expect(400);
  await request(app).get(`${path}/activity?month=2026-09`).expect(400);
  await request(app).get(`${path}/spending?month=2026-12`).expect(400);
  const currentActivity = (await request(app).get(`${path}/activity`).expect(200)).body;
  assert.equal(currentActivity.items.length, 0);
  now = new Date('2027-01-05T12:00:00Z');
  const later = SpendingSummarySchema.parse(
    (await request(app).get(`${path}/spending`).expect(200)).body,
  );
  assert.deepEqual(later.availableMonths, ['2026-11', '2026-12', '2027-01']);
  await request(app).get(`${path}/spending?month=2026-11`).expect(200);
  const latestBudget = (await request(app).get(path).expect(200)).body;
  assert.equal(latestBudget.createdAt, budget.createdAt);
});

test('US-12: Copenhagen creation month governs the log across a UTC month boundary', async () => {
  const now = new Date('2026-09-30T22:30:00Z');
  const app = createApp({
    bank: new JsonBankDataProvider(),
    budgets: new MemoryBudgetRepository(),
    identity: () => ({ userId: 'demo-user' }),
    clock: () => now,
  });
  const budget = (await request(app).post('/api/v1/budgets').send(createBudgetExample).expect(201))
    .body;
  const summary = SpendingSummarySchema.parse(
    (await request(app).get(`/api/v1/budgets/${budget.id}/spending`).expect(200)).body,
  );
  assert.equal(summary.startMonth, '2026-10');
  assert.deepEqual(summary.availableMonths, ['2026-10']);
});
