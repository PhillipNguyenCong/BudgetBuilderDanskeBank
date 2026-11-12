import {
  BudgetActivitySchema,
  ClassifiedTransactionSchema,
  CorrectTransactionSchema,
  IdSchema,
  SpendingSummarySchema,
  TransactionCorrectionSchema,
  type TransactionDecision,
} from '@budget-builder/contracts';
import { requestJson } from '../../lib/api';
const base = (id: string) => `/api/v1/budgets/${encodeURIComponent(IdSchema.parse(id))}`;
export const getSpendingSummary = (id: string, signal?: AbortSignal) =>
  requestJson(`${base(id)}/spending`, SpendingSummarySchema, signal);
export function getBudgetActivity(
  id: string,
  options: {
    offset?: number;
    potId?: string;
    month?: string;
    expectedSnapshotVersion?: string;
  } = {},
  signal?: AbortSignal,
) {
  const query = new URLSearchParams({ limit: '25', offset: String(options.offset ?? 0) });
  if (options.potId) query.set('potId', options.potId);
  if (options.month) query.set('month', options.month);
  if (options.expectedSnapshotVersion)
    query.set('expectedSnapshotVersion', options.expectedSnapshotVersion);
  return requestJson(`${base(id)}/activity?${query}`, BudgetActivitySchema, signal);
}
export const getBudgetTransaction = (id: string, transactionId: string, signal?: AbortSignal) =>
  requestJson(
    `${base(id)}/transactions/${encodeURIComponent(IdSchema.parse(transactionId))}`,
    ClassifiedTransactionSchema,
    signal,
  );
export function correctBudgetTransaction(
  id: string,
  transactionId: string,
  expectedRevision: number,
  expectedBudgetRevision: number,
  decision: TransactionDecision | null,
) {
  return requestJson(
    `${base(id)}/transactions/${encodeURIComponent(IdSchema.parse(transactionId))}/correction`,
    TransactionCorrectionSchema,
    undefined,
    undefined,
    {
      method: 'PUT',
      body: CorrectTransactionSchema.parse({ expectedRevision, expectedBudgetRevision, decision }),
      resourceLabel: 'transaction correction',
    },
  );
}
