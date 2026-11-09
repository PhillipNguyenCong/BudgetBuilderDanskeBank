import { AccountListSchema, BudgetListSchema, UserProfileSchema } from '@budget-builder/contracts';
import { requestJson } from '../../../lib/api';
export async function loadAccountSelection(signal?: AbortSignal) {
  const [user, accounts, budgets] = await Promise.all([
    requestJson('/api/v1/me', UserProfileSchema, signal),
    requestJson('/api/v1/accounts', AccountListSchema, signal),
    requestJson('/api/v1/budgets', BudgetListSchema, signal),
  ]);
  return { user, accounts, usedAccountIds: budgets.items.map((budget) => budget.accountId) };
}
export type AccountSelectionData = Awaited<ReturnType<typeof loadAccountSelection>>;
