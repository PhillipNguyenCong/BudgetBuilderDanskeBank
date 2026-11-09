import { z } from 'zod';
import { readFileSync, writeFileSync } from 'node:fs';
import {
  AccountListSchema,
  TransactionPageSchema,
  PaymentPageSchema,
  CreateBudgetSchema,
  UpdateBudgetSchema,
  BudgetSchema,
  BudgetListSchema,
  ErrorSchema,
  createBudgetExample,
} from '@budget-builder/contracts';
import { calculatePlan } from '@budget-builder/budget-core';
const schemas = {
  AccountList: AccountListSchema,
  TransactionPage: TransactionPageSchema,
  PaymentPage: PaymentPageSchema,
  CreateBudget: CreateBudgetSchema,
  UpdateBudget: UpdateBudgetSchema,
  Budget: BudgetSchema,
  BudgetList: BudgetListSchema,
  ApiError: ErrorSchema,
};
const ref = (name: string) => ({ $ref: '#/components/schemas/' + name });
const response = (name: string, description: string) => ({
  description,
  content: { 'application/json': { schema: ref(name) } },
});
const errors = {
  '400': response('ApiError', 'Invalid input'),
  '401': response('ApiError', 'Unauthenticated'),
  '404': response('ApiError', 'Resource not found'),
  '409': response('ApiError', 'Account in use or stale revision'),
  '413': response('ApiError', 'Request exceeds 1 MiB'),
  '422': response('ApiError', 'Over-allocation or monetary overflow'),
  '500': response('ApiError', 'Safe internal error'),
};
const id = {
  name: 'id',
  in: 'path',
  required: true,
  schema: { type: 'string', minLength: 1, maxLength: 128 },
};
const pagination = [
  {
    name: 'limit',
    in: 'query',
    schema: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
  },
  {
    name: 'offset',
    in: 'query',
    schema: { type: 'integer', minimum: 0, maximum: 100000, default: 0 },
  },
  ...['from', 'to'].map((name) => ({
    name,
    in: 'query',
    schema: { type: 'string', format: 'date' },
  })),
];
const read = (name: string, operationId: string, parameters: unknown[] = []) => ({
  operationId,
  parameters,
  responses: { '200': response(name, 'Success'), ...errors },
});
export const openapi = {
  openapi: '3.1.0',
  info: {
    title: 'Budget Builder API',
    version: '1.0.0',
    description:
      'Local demo identity only. All money is integer øre. Budget writes validate cross-row IDs, allocation totals and savings targets in addition to the JSON schemas. Raw datasets never reach clients. AI, forecasts and rollover execution are not implemented.',
  },
  servers: [{ url: 'http://127.0.0.1:3001' }],
  paths: {
    '/api/v1/accounts': { get: read('AccountList', 'listAccounts') },
    '/api/v1/accounts/{id}/transactions': {
      get: read('TransactionPage', 'listTransactions', [id, ...pagination]),
    },
    '/api/v1/accounts/{id}/payments': {
      get: read('PaymentPage', 'listPayments', [id, ...pagination]),
    },
    '/api/v1/budgets': {
      get: read('BudgetList', 'listBudgets'),
      post: {
        operationId: 'createBudget',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: ref('CreateBudget'), example: createBudgetExample },
          },
        },
        responses: {
          '201': response('Budget', 'Created; Location identifies the budget'),
          ...errors,
        },
      },
    },
    '/api/v1/budgets/{id}': {
      get: read('Budget', 'getBudget', [id]),
      put: {
        operationId: 'replaceBudgetPlan',
        parameters: [id],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: ref('UpdateBudget') } },
        },
        responses: { '200': response('Budget', 'Saved with incremented revision'), ...errors },
      },
    },
  },
  components: {
    schemas: Object.fromEntries(
      Object.entries(schemas).map(([name, schema]) => {
        const { $schema, ...json } = z.toJSONSchema(schema);
        return [name, json];
      }),
    ),
  },
};
const budgetExample = BudgetSchema.parse({
  id: 'budget-example',
  accountId: createBudgetExample.accountId,
  revision: 1,
  createdAt: '2026-09-03T12:00:00.000Z',
  updatedAt: '2026-09-03T12:00:00.000Z',
  plan: createBudgetExample.plan,
  totals: calculatePlan(createBudgetExample.plan),
});
const files = {
  'docs/openapi.json': openapi,
  'docs/examples/create-budget.json': createBudgetExample,
  'docs/examples/budget-response.json': budgetExample,
};
for (const [path, value] of Object.entries(files)) {
  const serialized = JSON.stringify(value, null, 2) + '\n';
  if (process.argv.includes('--check')) {
    if (readFileSync(path, 'utf8') !== serialized)
      throw new Error('Generated API artifact is stale: ' + path);
  } else writeFileSync(path, serialized);
}
