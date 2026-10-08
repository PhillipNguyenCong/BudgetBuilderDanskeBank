import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createDatabase } from './database.js';

test('missing database configuration fails with a safe message', () => {
  assert.throws(() => createDatabase(undefined), { message: 'DATABASE_URL is required.' });
  assert.throws(() => createDatabase(''), { message: 'DATABASE_URL is required.' });
});

test('malformed database configuration is rejected without echoing it', () => {
  const secret = 'not-a-postgres-url-with-secret';
  assert.throws(() => createDatabase(secret), { message: 'DATABASE_URL must be a valid PostgreSQL connection string.' });
});
