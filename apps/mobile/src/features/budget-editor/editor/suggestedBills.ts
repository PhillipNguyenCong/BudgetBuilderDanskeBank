import type { BillSuggestion } from '@budget-builder/contracts';
import { billIdentityKeys, billMerchantKeys } from '@budget-builder/budget-core/bill-matching';
import { draftRow, type Draft } from './draft';
export function remainingBillSuggestions(
  draft: Draft,
  suggestions: BillSuggestion[],
  dismissed: string[],
) {
  const rows = draft.widgets
    .filter((widget) => widget.type === 'FIXED_EXPENSE')
    .flatMap((widget) => widget.rows);
  return suggestions.filter((suggestion) => {
    const identity = billIdentityKeys(suggestion.match);
    if (identity.some((key) => dismissed.includes(key))) return false;
    return !rows.some((row) =>
      row.match
        ? billIdentityKeys(row.match).some((key) => identity.includes(key))
        : row.label.trim().toLocaleLowerCase('en') ===
            suggestion.label.trim().toLocaleLowerCase('en') ||
          billMerchantKeys({ text: row.label, counterparty: null }).some(
            (key) => key.startsWith('known:') && suggestion.match.merchantKeys.includes(key),
          ),
    );
  });
}
export function insertSuggestedBills(
  draft: Draft,
  targetId: string,
  suggestions: BillSuggestion[],
  onlyIfEmpty: boolean,
): Draft {
  const target = draft.widgets.find(
    (widget) => widget.id === targetId && widget.type === 'FIXED_EXPENSE',
  );
  if (!target || (onlyIfEmpty && target.rows.length > 0)) return draft;
  const existingIds = new Set(
    draft.widgets.flatMap((widget) => [widget.id, ...widget.rows.map((row) => row.id)]),
  );
  const accepted = remainingBillSuggestions(draft, suggestions, []).slice(
    0,
    Math.max(0, 1000 - target.rows.length),
  );
  if (!accepted.length) return draft;
  const rows = accepted.map((suggestion) => {
    let id = suggestion.id;
    let suffix = 1;
    while (existingIds.has(id)) id = `${suggestion.id}-${suffix++}`;
    existingIds.add(id);
    const row = draftRow({
      id,
      label: suggestion.label,
      amountOere: suggestion.amountOere ?? 0,
      ...(suggestion.frequency ? { frequency: suggestion.frequency } : {}),
      match: suggestion.match,
      source: suggestion.source,
      originalSuggestion: {
        label: suggestion.label,
        amountOere: suggestion.amountOere,
        frequency: suggestion.frequency,
      },
    });
    return {
      ...row,
      ...(suggestion.amountOere === null
        ? { input: '', originalInput: '', sourceAmountKnown: false }
        : {}),
      ...(!suggestion.frequency ? { needsFrequencyReview: true } : {}),
    };
  });
  return {
    ...draft,
    widgets: draft.widgets.map((widget) =>
      widget.id === targetId ? { ...widget, rows: [...widget.rows, ...rows] } : widget,
    ),
  };
}
