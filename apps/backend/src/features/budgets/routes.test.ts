import assert from 'node:assert/strict';
import { test } from 'node:test';
import request from 'supertest';
import { createApp } from '../../app.js';
import { MemoryBudgetRepository } from './memory-repository.js';
import { JsonBankDataProvider } from '../../infrastructure/banking/json-bank-data-provider.js';
import {
  createBudgetExample,
  BudgetSchema,
  ErrorSchema,
  TransactionPageSchema,
  PaymentPageSchema,
} from '@budget-builder/contracts';
import { createLocalRuntime } from '../../runtime.js';
const clock = () => new Date('2026-09-03T12:00:00Z');
function fixture() {
  let identity = 'demo-user';
  const budgets = new MemoryBudgetRepository();
  const app = createApp({
    bank: new JsonBankDataProvider(),
    budgets,
    identity: () => ({ userId: identity }),
    clock,
  });
  return {
    app,
    budgets,
    user: (id: string) => {
      identity = id;
    },
  };
}
const body = () => structuredClone(createBudgetExample);
test('create and reopen derives totals, preserves savings, rows and colors', async () => {
  const f = fixture();
  const created = await request(f.app).post('/api/v1/budgets').send(body()).expect(201);
  const b = BudgetSchema.parse(created.body);
  assert.equal(b.totals.unallocatedOere, 0);
  assert.equal(b.revision, 1);
  assert.equal('ownerId' in b, false);
  const p = body().plan;
  p.pots[0]!.rows[0]!.amountOere = 700001;
  p.pots[0]!.name = 'My food';
  p.pots[0]!.color = 'ROSE';
  const saved = await request(f.app)
    .put('/api/v1/budgets/' + b.id)
    .send({ expectedRevision: 1, plan: p })
    .expect(200);
  assert.equal(saved.body.totals.unallocatedOere, 99999);
  assert.equal(saved.body.plan.pots[2].rows[0].amountOere, 400000);
  assert.equal(saved.body.revision, 2);
  const reopened = await request(f.app)
    .get('/api/v1/budgets/' + b.id)
    .expect(200);
  assert.deepEqual(reopened.body, saved.body);
});
test('invalid allocations, row IDs, names and savings targets preserve stored plan', async () => {
  const f = fixture();
  const created = await request(f.app).post('/api/v1/budgets').send(body()).expect(201);
  for (const change of [
    (p: ReturnType<typeof body>['plan']) => {
      p.name = ' ';
    },
    (p: ReturnType<typeof body>['plan']) => {
      p.pots[0]!.rows[0]!.amountOere = -1;
    },
    (p: ReturnType<typeof body>['plan']) => {
      p.pots[0]!.rows[0]!.id = 'salary';
    },
    (p: ReturnType<typeof body>['plan']) => {
      const s = p.pots[0]!;
      if (s.type === 'SPENDING')
        s.rollover = { enabled: true, destination: 'TO_SAVINGS', targetPotId: 'bills' };
    },
  ]) {
    const p = body().plan;
    change(p);
    const response = await request(f.app)
      .put('/api/v1/budgets/' + created.body.id)
      .send({ expectedRevision: 1, plan: p })
      .expect(400);
    ErrorSchema.parse(response.body);
  }
  const p = body().plan;
  p.pots[0]!.rows[0]!.amountOere = 900000;
  await request(f.app)
    .put('/api/v1/budgets/' + created.body.id)
    .send({ expectedRevision: 1, plan: p })
    .expect(422);
  const current = await request(f.app)
    .get('/api/v1/budgets/' + created.body.id)
    .expect(200);
  assert.equal(current.body.revision, 1);
  assert.deepEqual(current.body.plan, body().plan);
});
test('account identity is immutable; customer headers cannot confer ownership', async () => {
  const f = fixture();
  const b = await request(f.app).post('/api/v1/budgets').send(body()).expect(201);
  await request(f.app)
    .put('/api/v1/budgets/' + b.body.id)
    .send({ expectedRevision: 1, accountId: 'other', plan: body().plan })
    .expect(400);
  f.user('other-user');
  await request(f.app)
    .get('/api/v1/budgets/' + b.body.id)
    .set('x-user-id', 'demo-user')
    .expect(404);
  await request(f.app).post('/api/v1/budgets').send(body()).expect(404);
  await request(f.app).get('/api/v1/accounts/demo-account/transactions').expect(404);
  assert.deepEqual((await request(f.app).get('/api/v1/budgets').expect(200)).body.items, []);
});
test('concurrent creation and stale updates return conflicts', async () => {
  const f = fixture();
  const results = await Promise.all(
    [1, 2].map(() => request(f.app).post('/api/v1/budgets').send(body())),
  );
  assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
  const b = results.find((r) => r.status === 201)!.body;
  const updates = await Promise.all(
    [1, 2].map(() =>
      request(f.app)
        .put('/api/v1/budgets/' + b.id)
        .send({ expectedRevision: 1, plan: body().plan }),
    ),
  );
  assert.deepEqual(updates.map((r) => r.status).sort(), [200, 409]);
});
test('pagination and date filters are bounded and validated', async () => {
  const f = fixture();
  const a = await request(f.app).get('/api/v1/accounts').expect(200);
  assert.equal(a.body.quality.coverage.completeMonths, 2);
  assert.equal(JSON.stringify(a.body).includes('0000001234'), false);
  const t = await request(f.app)
    .get('/api/v1/accounts/demo-account/transactions?limit=1')
    .expect(200);
  TransactionPageSchema.parse(t.body);
  assert.equal(t.body.page.hasMore, true);
  const filtered = await request(f.app)
    .get('/api/v1/accounts/demo-account/transactions?from=2026-09-01&to=2026-09-01')
    .expect(200);
  assert.equal(filtered.body.items.length, 1);
  for (const query of [
    'limit=101',
    'offset=-1',
    'from=2026-02-30',
    'from=2026-10-01&to=2026-09-01',
    'limit=1&limit=2',
  ])
    await request(f.app)
      .get('/api/v1/accounts/demo-account/transactions?' + query)
      .expect(400);
  PaymentPageSchema.parse(
    (await request(f.app).get('/api/v1/accounts/demo-account/payments').expect(200)).body,
  );
});
test('memory runtime does not call fetch or require a database', async (t) => {
  const mock = t.mock.method(globalThis, 'fetch', () => {
    throw new Error('External network is forbidden');
  });
  const app = createLocalRuntime({
    NODE_ENV: 'test',
    BUDGET_STORAGE: 'memory',
    DATABASE_URL: 'invalid-must-not-be-used',
  });
  await request(app).get('/api/v1/accounts').expect(200);
  await request(app).post('/api/v1/budgets').send(body()).expect(201);
  assert.equal(mock.mock.callCount(), 0);
});
test('deployed environments cannot silently use the demo user', () => {
  assert.throws(() => createLocalRuntime({ NODE_ENV: 'production' }), /Demo identity/);
  assert.throws(() => createLocalRuntime({ VERCEL: '1' }), /Demo identity/);
});
test('request totals and oversized JSON are not accepted', async () => {
  const f = fixture();
  await request(f.app)
    .post('/api/v1/budgets')
    .send({ ...body(), totals: { incomeOere: 1 } })
    .expect(400);
  await request(f.app)
    .post('/api/v1/budgets')
    .send({ data: 'x'.repeat(1100000) })
    .expect(413);
});

test('valid savings rollover survives reopening; disabled automation remains optional', async () => {
  const f = fixture();
  const input = body();
  const spending = input.plan.pots[0]!;
  if (spending.type === 'SPENDING')
    spending.rollover = { enabled: true, destination: 'TO_SAVINGS', targetPotId: 'savings' };
  const created = await request(f.app).post('/api/v1/budgets').send(input).expect(201);
  const reopened = await request(f.app)
    .get('/api/v1/budgets/' + created.body.id)
    .expect(200);
  assert.deepEqual(reopened.body.plan.pots[0].rollover, {
    enabled: true,
    destination: 'TO_SAVINGS',
    targetPotId: 'savings',
  });
});
test('internal failures return safe errors without exposing database details', async () => {
  const app = createApp({
    identity: () => ({ userId: 'demo-user' }),
    bank: new JsonBankDataProvider(),
    budgets: {
      ...new MemoryBudgetRepository(),
      list: async () => {
        throw new Error('postgres://secret-password financial-payload');
      },
      find: async () => null,
      create: async () => {
        throw new Error('not used');
      },
      update: async () => null,
    },
  });
  const response = await request(app).get('/api/v1/budgets').expect(500);
  ErrorSchema.parse(response.body);
  assert.ok(!JSON.stringify(response.body).includes('secret-password'));
});
