import {
  BudgetListSchema,
  BudgetSchema,
  CreateBudgetSchema,
  IdSchema,
  type BudgetPlan,
} from '@budget-builder/contracts';
import { requestJson } from '../../../lib/api';
import { loadAccountSelection } from './accounts';

export async function listBudgets(signal?: AbortSignal) {
  return (await requestJson('/api/v1/budgets', BudgetListSchema, signal)).items;
}
export async function createBudget(accountId: string, plan: BudgetPlan, signal?: AbortSignal) {
  const body = CreateBudgetSchema.parse({ accountId, plan });
  return requestJson('/api/v1/budgets', BudgetSchema, signal, undefined, { method: 'POST', body });
}
export async function loadBudgetSetup(accountId: string, signal?: AbortSignal) {
  if (!IdSchema.safeParse(accountId).success)
    throw new Error('Select an account before creating a budget.');
  const data = await loadAccountSelection(signal);
  const account = data.accounts.items.find((item) => item.id === accountId);
  if (!account) throw new Error('This account is not available. Return to account selection.');
  if (data.usedAccountIds.includes(accountId))
    throw new Error('This account already has a budget. Return to Budget to view it.');
  if (account.currency !== 'DKK')
    throw new Error('Only DKK accounts are supported in this prototype.');
  return { account, quality: data.accounts.quality };
}
export type BudgetSetup = Awaited<ReturnType<typeof loadBudgetSetup>>;
