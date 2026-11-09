import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JsonBankDataProvider } from './json-bank-data-provider.js';
import { demoData } from './demo-data.js';
test('concurrent reads load data once and returned copies cannot corrupt the cache', async () => {
  let reads = 0;
  const provider = new JsonBankDataProvider({
    load: async () => {
      reads++;
      return demoData;
    },
  });
  const [a, b] = await Promise.all([
    provider.getSnapshot('demo-user', 'demo-account'),
    provider.getSnapshot('demo-user', 'demo-account'),
  ]);
  assert.equal(reads, 1);
  a!.account.name = 'changed';
  assert.notEqual(b!.account.name, 'changed');
  assert.notEqual(
    (await provider.getSnapshot('demo-user', 'demo-account'))!.account.name,
    'changed',
  );
  assert.equal(await provider.getSnapshot('intruder', 'demo-account'), null);
});
