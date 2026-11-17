import assert from 'node:assert/strict';
import { test } from 'node:test';
import request from 'supertest';
import { SalarySuggestionSchema } from '@budget-builder/contracts';
import { MemoryBudgetRepository } from '../budgets/memory-repository.js';
import { createApp } from '../../app.js';
import { JsonBankDataProvider } from '../../infrastructure/banking/json-bank-data-provider.js';
import { demoData } from '../../infrastructure/banking/demo-data.js';
test('US-04/10: salary suggestion validates its contract and enforces trusted ownership', async () => {
  const provider = new JsonBankDataProvider({
    load: async () => ({
      ...demoData,
      transactions: {
        items: [
          {
            id: 'salary',
            bookedOn: '2026-08-31',
            direction: 'CREDIT',
            status: 'BOOKED',
            amount: { value: 25000, currency: 'DKK' },
            originalTransactionText: 'Salary',
            counterpartyName: 'Employer',
          },
        ],
      },
    }),
  });
  let userId = 'demo-user';
  const app = createApp({
    bank: provider,
    budgets: new MemoryBudgetRepository(),
    identity: () => ({ userId }),
  });
  const accounts = await request(app).get('/api/v1/accounts').expect(200);
  const id = accounts.body.items[0].id;
  const response = await request(app).get(`/api/v1/accounts/${id}/salary-suggestion`).expect(200);
  const data = SalarySuggestionSchema.parse(response.body);
  assert.equal(data.suggestion?.amountOere, 2500000);
  await request(app).get('/api/v1/accounts/other/salary-suggestion').expect(404);
  userId = 'other-user';
  await request(app)
    .get(`/api/v1/accounts/${id}/salary-suggestion?customerId=demo-user`)
    .expect(404);
});
