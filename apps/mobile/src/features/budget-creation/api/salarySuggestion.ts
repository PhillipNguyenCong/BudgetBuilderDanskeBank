import { IdSchema, SalarySuggestionSchema } from '@budget-builder/contracts';
import { requestJson } from '../../../lib/api';
export async function loadSalarySuggestion(accountId: string, signal?: AbortSignal) {
  const id = IdSchema.parse(accountId);
  const result = await requestJson(
    `/api/v1/accounts/${encodeURIComponent(id)}/salary-suggestion`,
    SalarySuggestionSchema,
    signal,
  );
  if (result.accountId !== id)
    throw new Error('Salary suggestion did not match the selected account.');
  return result;
}
