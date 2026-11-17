import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SpendingNumbersSchema } from './spending.js';
const numbers = {
  allocationOere: 100000,
  carriedInOere: 0,
  recordedSpendingOere: 25000,
  pendingSpendingOere: 0,
  unconfirmedSpendingOere: 0,
  reviewAffectingCount: 1,
  remainingOere: 75000,
  overspentOere: 0,
  weeklyGuideDkk: 300,
  dailyGuideDkk: 43,
  limitations: ['An amount needs review.'],
};
test('US-06/10: successful guidance cannot regress to null amounts, including when provisional', () => {
  assert.equal(SpendingNumbersSchema.safeParse(numbers).success, true);
  for (const field of ['remainingOere', 'overspentOere', 'weeklyGuideDkk', 'dailyGuideDkk']) {
    assert.equal(SpendingNumbersSchema.safeParse({ ...numbers, [field]: null }).success, false);
    assert.equal(SpendingNumbersSchema.safeParse({ ...numbers, [field]: NaN }).success, false);
  }
});
