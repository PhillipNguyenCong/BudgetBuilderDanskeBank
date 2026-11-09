import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
  UserProfileSchema,
  userProfileExample,
  BudgetSchema,
  CreateBudgetSchema,
  createBudgetExample,
} from './index.js';
test('published request and response examples match runtime schemas', () => {
  const request = JSON.parse(
    readFileSync(new URL('../../../docs/examples/create-budget.json', import.meta.url), 'utf8'),
  );
  const response = JSON.parse(
    readFileSync(new URL('../../../docs/examples/budget-response.json', import.meta.url), 'utf8'),
  );
  assert.deepEqual(CreateBudgetSchema.parse(request), createBudgetExample);
  BudgetSchema.parse(response);
});
test('unknown keys and fractional oere are rejected', () => {
  assert.equal(
    CreateBudgetSchema.safeParse({ ...createBudgetExample, ownerId: 'attacker' }).success,
    false,
  );
  const example = structuredClone(createBudgetExample);
  example.plan.income.rows[0]!.amountOere = 1.5;
  assert.equal(CreateBudgetSchema.safeParse(example).success, false);
});

test('published user profile example validates and does not expose account fields', () => {
  const profile = JSON.parse(
    readFileSync(
      new URL('../../../docs/examples/user-profile-response.json', import.meta.url),
      'utf8',
    ),
  );
  assert.deepEqual(UserProfileSchema.parse(profile), userProfileExample);
  assert.equal(
    UserProfileSchema.safeParse({ ...profile, accountNumber: 'private' }).success,
    false,
  );
  assert.equal(UserProfileSchema.safeParse({ ...profile, displayName: ' ' }).success, false);
});
