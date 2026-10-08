import assert from 'node:assert/strict';
import { test } from 'node:test';
import request from 'supertest';
import app from '../../index.js';

test('health is available without database credentials and has no secrets', async () => {
  const response = await request(app).get('/health').expect(200);
  assert.deepEqual(response.body, { status: 'ok', service: 'budget-builder-backend' });
  assert.equal(response.headers['x-powered-by'], undefined);
  assert.equal(response.headers['cache-control'], 'no-store');
});

test('unknown paths return a JSON 404', async () => {
  const response = await request(app).get('/missing').expect(404);
  assert.deepEqual(response.body, { error: { code: 'NOT_FOUND', message: 'Route not found.' } });
});

test('unsupported health mutation does not succeed', async () => {
  await request(app).post('/health').expect(404);
});
