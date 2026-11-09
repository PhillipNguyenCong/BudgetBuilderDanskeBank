import { createBudgetExample } from '@budget-builder/contracts';
import { formatDkk } from '../../budget-shared';
import { createDraft, draftRow, newRow, parseAmount, validateDraft } from './draft';

it('NFR-04: preserves exact legacy fractions and formats maximum safe money without rounding', () => {
  const row = draftRow({ id: 'exact', label: 'Exact amount', amountOere: Number.MAX_SAFE_INTEGER });
  expect(parseAmount(row).amount).toBe(Number.MAX_SAFE_INTEGER);
  expect(formatDkk(Number.MAX_SAFE_INTEGER)).toBe('DKK 90,071,992,547,409.91');
  expect(formatDkk(-1)).toBe('DKK -0.01');
  expect(parseAmount({ ...row, input: '90071992547410' }).error).toBe('This amount is too large.');
  expect(parseAmount({ ...row, input: '100.50' }).error).toBe(
    'Use a non-negative whole-DKK amount.',
  );
});

it('US-10: blank, decimal, negative and exponential input never becomes zero', () => {
  const row = newRow('blank');
  for (const input of ['', ' ', '-1', '1.5', '1e3', '1,000', '1.000']) {
    expect(parseAmount({ ...row, input }).error).toBeDefined();
  }
  expect(parseAmount({ ...row, input: '0' }).amount).toBe(0);
  expect(parseAmount({ ...row, input: '24000' }).amount).toBe(2400000);
});

it('US-04/13: draft validation preserves rollover and source metadata and rejects blank names', () => {
  const original = createBudgetExample.plan;
  const draft = createDraft(original);
  draft.widgets[0]!.rows[0]!.input = '25000';
  const result = validateDraft(draft);
  expect(result.totals?.unallocatedOere).toBe(100000);
  expect(result.plan?.pots[0]).toEqual(original.pots[0]);
  expect(original.income.rows[0]!.amountOere).toBe(2400000);
  draft.name = ' ';
  expect(validateDraft(draft).plan).toBeUndefined();
});

it('keeps a persisted customer adjustment distinct from the original suggestion after reopening', () => {
  const plan = structuredClone(createBudgetExample.plan);
  const row = plan.income.rows[0]!;
  row.amountOere = 2500000;
  row.source = {
    kind: 'SUGGESTED',
    explanation: 'Historical sample income.',
    recordIds: [],
    period: null,
  };
  row.originalSuggestion = { label: row.label, amountOere: 2400000 };
  row.adjustedByUser = true;
  const reopened = validateDraft(createDraft(plan));
  expect(reopened.totals?.incomeOere).toBe(2500000);
  expect(reopened.plan?.income.rows[0]?.originalSuggestion?.amountOere).toBe(2400000);
  expect(reopened.plan?.income.rows[0]?.adjustedByUser).toBe(true);
});
