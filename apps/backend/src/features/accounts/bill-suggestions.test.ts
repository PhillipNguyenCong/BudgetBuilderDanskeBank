import assert from 'node:assert/strict';
import { test } from 'node:test';
import request from 'supertest';
import { BillSuggestionsSchema, createBudgetExample } from '@budget-builder/contracts';
import { createApp } from '../../app.js';
import { JsonBankDataProvider } from '../../infrastructure/banking/json-bank-data-provider.js';
import { demoData } from '../../infrastructure/banking/demo-data.js';
import { MemoryBudgetRepository } from '../budgets/memory-repository.js';

test('US-04: on-demand bill reads enforce account ownership, create no budget and retain renamed bill connections through save/reopen', async () => {
  let ownerId = 'demo-user';
  const raw = {
    ...demoData,
    transactions: {
      isSuccess: true,
      items: [
        {
          id: 'rent-july',
          bookedOn: '2026-07-01',
          direction: 'DEBIT',
          status: 'BOOKED',
          amount: { value: -8000, currency: 'DKK' },
          originalTransactionText: 'Husleje',
        },
        {
          id: 'rent-august',
          bookedOn: '2026-08-01',
          direction: 'DEBIT',
          status: 'BOOKED',
          amount: { value: -8000, currency: 'DKK' },
          originalTransactionText: 'RENT AUGUST',
        },
        {
          id: 'net-july',
          bookedOn: '2026-07-02',
          direction: 'DEBIT',
          status: 'BOOKED',
          amount: { value: -99, currency: 'DKK' },
          originalTransactionText: 'NETFLIX.COM',
        },
        {
          id: 'net-august',
          bookedOn: '2026-08-02',
          direction: 'DEBIT',
          status: 'BOOKED',
          amount: { value: -99, currency: 'DKK' },
          originalTransactionText: 'Netflix',
        },
        {
          id: 'rent-sept',
          bookedOn: '2026-09-01',
          direction: 'DEBIT',
          status: 'BOOKED',
          amount: { value: -8000, currency: 'DKK' },
          originalTransactionText: 'RENT SEPTEMBER',
        },
      ],
    },
  };
  const budgets = new MemoryBudgetRepository();
  const app = createApp({
    bank: new JsonBankDataProvider({ load: async () => raw }),
    budgets,
    identity: () => ({ userId: ownerId }),
  });
  const path = '/api/v1/accounts/demo-account/bill-suggestions';
  const suggestions = BillSuggestionsSchema.parse((await request(app).get(path).expect(200)).body);
  assert.equal(suggestions.snapshotDate, '2026-09-03');
  assert.equal(suggestions.suggestions.filter((s) => s.confidence === 'RECURRING').length, 2);
  assert.equal((await budgets.list(ownerId)).length, 0);
  const body = structuredClone(createBudgetExample);
  const fixed = body.plan.pots.find((p) => p.type === 'FIXED_EXPENSE')!;
  fixed.rows = suggestions.suggestions
    .filter((s) => s.confidence === 'RECURRING')
    .map((s) => ({
      id: s.id,
      label: s.label === 'Rent' ? 'Husleje' : s.label,
      amountOere: s.amountOere!,
      frequency: s.frequency!,
      match: s.match,
      source: s.source,
    }));
  const saved = (await request(app).post('/api/v1/budgets').send(body).expect(201)).body;
  const reopened = (await request(app).get(`/api/v1/budgets/${saved.id}`).expect(200)).body;
  assert.deepEqual(reopened.plan, body.plan);
  const activity = (await request(app).get(`/api/v1/budgets/${saved.id}/activity`).expect(200)).body
    .items;
  const rent = activity.find(
    (a: { transaction: { sourceId: string } }) => a.transaction.sourceId === 'rent-sept',
  );
  assert.equal(rent.potId, fixed.id);
  assert.equal(rent.billRowId, fixed.rows.find((r) => r.label === 'Husleje')!.id);
  ownerId = 'another-user';
  await request(app).get(path).set('x-user-id', 'demo-user').expect(404);
  await request(app).get('/api/v1/accounts/foreign-account/bill-suggestions').expect(404);
});
