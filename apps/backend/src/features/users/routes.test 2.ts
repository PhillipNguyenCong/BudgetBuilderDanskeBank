import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { UserProfileSchema, ErrorSchema } from '@budget-builder/contracts';
import { createApp } from '../../app.js';
import { createLocalRuntime } from '../../runtime.js';
import { JsonBankDataProvider } from '../../infrastructure/banking/json-bank-data-provider.js';
import { demoData } from '../../infrastructure/banking/demo-data.js';
import { MemoryBudgetRepository } from '../budgets/memory-repository.js';

test('profile and account data use one source and trusted owner, not request identity', async () => {
  let reads = 0;
  let userId = 'demo-user';
  const bank = new JsonBankDataProvider({
    load: async () => {
      reads++;
      return { ...demoData, account: { ...demoData.account, ownerName: '  Demo Customer  ' } };
    },
  });
  const app = createApp({
    bank,
    identity: () => ({ userId }),
    budgets: new MemoryBudgetRepository(),
  });
  const paths = [
    '/me',
    '/accounts',
    '/accounts/demo-account/transactions',
    '/accounts/demo-account/payments',
  ];
  const results = await Promise.all(
    paths.map((path) =>
      request(app)
        .get('/api/v1' + path)
        .set('x-user-id', 'intruder')
        .expect(200),
    ),
  );
  assert.deepEqual(UserProfileSchema.parse(results[0]!.body), {
    id: 'demo-user',
    displayName: 'Demo Customer',
    isDemo: true,
  });
  assert.equal(reads, 1);
  const profile = await bank.getProfile('demo-user');
  profile!.displayName = 'Mutated';
  assert.equal((await bank.getProfile('demo-user'))!.displayName, 'Demo Customer');
  assert.equal(
    (await request(app).get('/api/v1/me?userId=intruder').expect(200)).body.id,
    'demo-user',
  );
  userId = 'intruder';
  for (const path of paths)
    await request(app)
      .get('/api/v1' + path)
      .set('x-user-id', 'demo-user')
      .expect(404);
  assert.equal(reads, 1);
  userId = '';
  await request(app).get('/api/v1/me').expect(401);
});

test('missing, blank and non-string owner names remain unknown', async () => {
  for (const ownerName of [undefined, null, '', '   ', 123]) {
    const bank = new JsonBankDataProvider({
      load: async () => ({ ...demoData, account: { ...demoData.account, ownerName } }),
    });
    assert.deepEqual(await bank.getProfile('demo-user'), {
      id: 'demo-user',
      displayName: null,
      isDemo: true,
    });
  }
});

test('configured unreadable and invalid files return safe errors without fallback', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'demo-user-test-'));
  try {
    for (const content of [null, '{secret-invalid-payload', 'null', '{"account":[]}']) {
      const path = join(directory, 'private-data.json');
      if (content !== null) await writeFile(path, content);
      const app = createLocalRuntime({ NODE_ENV: 'test', BANK_DATA_FILE: path });
      for (const endpoint of [
        '/me',
        '/accounts',
        '/accounts/demo-account/transactions',
        '/accounts/demo-account/payments',
      ]) {
        const response = await request(app)
          .get('/api/v1' + endpoint)
          .expect(503);
        ErrorSchema.parse(response.body);
        assert.equal(response.body.error.code, 'BANK_DATA_UNAVAILABLE');
        assert.ok(!JSON.stringify(response.body).includes(directory));
        assert.ok(!JSON.stringify(response.body).includes('secret-invalid-payload'));
      }
      await request(app).get('/health').expect(200);
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
