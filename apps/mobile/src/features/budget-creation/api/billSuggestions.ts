import { BillSuggestionsSchema, IdSchema } from '@budget-builder/contracts';
import { requestJson } from '../../../lib/api';
export async function loadAccountBillSuggestions(accountId: string, signal?: AbortSignal) {
  const result = await requestJson(
    `/api/v1/accounts/${encodeURIComponent(IdSchema.parse(accountId))}/bill-suggestions`,
    BillSuggestionsSchema,
    signal,
  );
  if (result.accountId !== accountId)
    throw new Error('Bill suggestions did not match the selected account.');
  return result;
}
