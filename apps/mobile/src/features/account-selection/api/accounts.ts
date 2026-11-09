import { AccountListSchema, UserProfileSchema } from '@budget-builder/contracts';
import { listBudgets } from '../../budget-shared';
import { requestJson } from '../../../lib/api';
export async function loadAccountSelection(signal?: AbortSignal) {
  const [user, accounts, budgets] = await Promise.all([
    requestJson('/api/v1/me', UserProfileSchema, signal),
    requestJson('/api/v1/accounts', AccountListSchema, signal),
    listBudgets(signal),
  ]);
  return { user, accounts, usedAccountIds: budgets.map((budget) => budget.accountId) };
}
export type AccountSelectionData = Awaited<ReturnType<typeof loadAccountSelection>>;
