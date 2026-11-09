import {
  BudgetListSchema,
  BudgetSchema,
  CreateBudgetSchema,
  type BudgetPlan,
} from '@budget-builder/contracts';
import { requestJson } from '../../../lib/api';

export async function listBudgets(signal?: AbortSignal) {
  return (await requestJson('/api/v1/budgets', BudgetListSchema, signal)).items;
}
export async function createBudget(accountId: string, plan: BudgetPlan, signal?: AbortSignal) {
  const body = CreateBudgetSchema.parse({ accountId, plan });
  return requestJson('/api/v1/budgets', BudgetSchema, signal, undefined, { method: 'POST', body });
}
