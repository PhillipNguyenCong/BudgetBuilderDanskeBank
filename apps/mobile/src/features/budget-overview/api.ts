import {
  BudgetMonthSchema,
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
export const getSpendingSummary = (id: string, signal?: AbortSignal, month?: string) =>
  requestJson(
    `${base(id)}/spending${month ? `?month=${BudgetMonthSchema.parse(month)}` : ''}`,
    SpendingSummarySchema,
    signal,
  );
export function getBudgetActivity(
  id: string,
  options: {
    limit?: number;
    range?: 'account';
    offset?: number;
    potId?: string;
    month?: string;
    review?: 'undated';
    expectedSnapshotVersion?: string;
  } = {},
  signal?: AbortSignal,
) {
  const query = new URLSearchParams({
    limit: String(options.limit ?? 25),
    offset: String(options.offset ?? 0),
  });
  if (options.range) query.set('range', options.range);
  if (options.potId) query.set('potId', options.potId);
  if (options.month) query.set('month', options.month);
  if (options.review) query.set('review', options.review);
  if (options.expectedSnapshotVersion)
    query.set('expectedSnapshotVersion', options.expectedSnapshotVersion);
  return requestJson(`${base(id)}/activity?${query}`, BudgetActivitySchema, signal);
}
export const getBudgetTransaction = (
  id: string,
  transactionId: string,
  signal?: AbortSignal,
  month?: string,
) =>
  requestJson(
    `${base(id)}/transactions/${encodeURIComponent(IdSchema.parse(transactionId))}${month ? `?month=${BudgetMonthSchema.parse(month)}` : ''}`,
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
