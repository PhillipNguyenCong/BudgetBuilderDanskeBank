import { manualPlan } from '../../budget-creation/api';
import { billSuggestions } from '../../../tests/billSuggestionFixtures';
import { createDraft, draftRow, validateDraft } from './draft';
import { createAutoAllocationDraft } from './autoAllocation';

function draft() {
  const value = createDraft(manualPlan());
  value.name = 'Auto budget';
  value.widgets[0]!.rows[0]!.input = '20000';
  return value;
}

it('US-04: preserves manual bill edits, excludes dismissed suggestions and applies exact complete totals', () => {
  const value = draft();
  const data = billSuggestions();
  const fixed = value.widgets.find((w) => w.type === 'FIXED_EXPENSE')!;
  const row = draftRow({
    id: 'my-rent',
    label: 'My rent',
    amountOere: 900000,
    match: data.suggestions[0]!.match,
  });
  fixed.rows = [row];
  const before = structuredClone(value);
  const { draft: result, allocation } = createAutoAllocationDraft(value, data, ['known:netflix']);
  expect(allocation.groceriesOere).toBe(100000);
  expect(result.widgets.find((w) => w.type === 'FIXED_EXPENSE')!.rows).toEqual([row]);
  expect(validateDraft(result).totals?.unallocatedOere).toBe(0);
  expect(
    validateDraft(result)
      .plan?.pots.filter((p) => p.type === 'SPENDING')
      .map((p) => p.purpose),
  ).toEqual(['GROCERIES', 'FUN']);
  expect(value).toEqual(before);
});

it('US-10: missing bill amounts stay incomplete', () => {
  const data = billSuggestions();
  data.suggestions[0]!.amountOere = null;
  expect(() => createAutoAllocationDraft(draft(), data, [])).toThrow(/bills/i);
});

it.each([
  [null, 300000],
  ['MONTHLY', 300000],
  ['QUARTERLY', 900000],
  ['HALF_YEARLY', 1800000],
  ['YEARLY', 3600000],
] as const)(
  'US-04/05: frequency %s uses Monthly by default and preserves explicit non-monthly cadence',
  (frequency, amountOere) => {
    const data = billSuggestions();
    data.suggestions = [{ ...data.suggestions[0]!, frequency, amountOere }];
    const result = createAutoAllocationDraft(draft(), data, []);
    expect(result.allocation.fixedExpensesOere).toBe(300000);
    expect(result.allocation.groceriesOere).toBe(700000);
    const row = validateDraft(result.draft).plan?.pots[0]!.rows[0];
    expect(row).toEqual(
      expect.objectContaining({
        frequency: frequency ?? 'MONTHLY',
        originalSuggestion: { label: 'Rent', amountOere, frequency },
      }),
    );
  },
);

it('US-04: includes possible bills without converting their evidence into confirmed recurrence', () => {
  const data = billSuggestions();
  data.suggestions[0]!.confidence = 'POSSIBLE';
  const result = createAutoAllocationDraft(draft(), data, []);
  expect(validateDraft(result.draft).plan?.pots[0]!.rows[0]).toEqual(
    expect.objectContaining({
      suggestionConfidence: 'POSSIBLE',
      originalSuggestion: { label: 'Rent', amountOere: 800000, frequency: 'MONTHLY' },
    }),
  );
});

it('US-04: sums multiple income rows and rejects blank income or aggregate overflow', () => {
  const value = draft();
  value.widgets[0]!.rows.push({ ...value.widgets[0]!.rows[0]!, id: 'second', input: '5000' });
  expect(createAutoAllocationDraft(value, billSuggestions(), []).allocation.incomeOere).toBe(
    2500000,
  );
  value.widgets[0]!.rows[1]!.input = '';
  expect(() => createAutoAllocationDraft(value, billSuggestions(), [])).toThrow(/income/i);
  value.widgets[0]!.rows[0]!.input = '90071992547409.91';
  value.widgets[0]!.rows[1]!.input = '0.01';
  expect(() => createAutoAllocationDraft(value, billSuggestions(), [])).toThrow(/large/i);
});
