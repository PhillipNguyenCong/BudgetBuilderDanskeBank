import { createBudgetExample } from '@budget-builder/contracts';
import { formatDkk } from '../../budget-shared';
import { createDraft, draftRow, isAmountInput, newRow, parseAmount, validateDraft } from './draft';

it('NFR-04: preserves exact legacy fractions and formats maximum safe money without rounding', () => {
  const row = draftRow({ id: 'exact', label: 'Exact amount', amountOere: Number.MAX_SAFE_INTEGER });
  expect(parseAmount(row).amount).toBe(Number.MAX_SAFE_INTEGER);
  expect(formatDkk(Number.MAX_SAFE_INTEGER)).toBe('DKK 90,071,992,547,409.91');
  expect(formatDkk(-1)).toBe('DKK -0.01');
  expect(parseAmount({ ...row, input: '90071992547410' }).error).toBe('This amount is too large.');
  expect(parseAmount({ ...row, input: '100.50' }).amount).toBe(10050);
  expect(parseAmount({ ...row, input: '90071992547409.91' }).amount).toBe(Number.MAX_SAFE_INTEGER);
  expect(parseAmount({ ...row, input: '90071992547409.92' }).error).toBe(
    'This amount is too large.',
  );
});

it('US-10: blank, excessive precision, negative and exponential input never becomes zero', () => {
  const row = newRow('blank');
  for (const input of ['', ' ', '-1', '1.555', '1e3', '1,000', '1.000']) {
    expect(parseAmount({ ...row, input }).amount).toBeUndefined();
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

it('converts decimals exactly and permits only editable two-decimal input', () => {
  const row = newRow('decimal');
  for (const [input, amount] of [
    ['1250,50', 125050],
    ['1250.5', 125050],
    ['0.01', 1],
    ['12,', 1200],
    ['0', 0],
  ] as const) {
    expect(isAmountInput(input)).toBe(true);
    expect(parseAmount({ ...row, input }).amount).toBe(amount);
  }
  expect(isAmountInput('')).toBe(true);
  expect(parseAmount(row)).toEqual({});
  for (const input of ['12.345', '1,234.50', '1.234,50', '1 000', '-1', 'abc', '1e3'])
    expect(isAmountInput(input)).toBe(false);
});

it('preserves decimal amounts and exact totals through contract serialization and reopening', () => {
  const draft = createDraft(createBudgetExample.plan);
  draft.widgets[0]!.rows[0]!.input = '25000,51';
  draft.widgets[1]!.rows[0]!.input = '8000.10';
  draft.widgets[2]!.rows[0]!.input = '7000,20';
  draft.widgets[3]!.rows[0]!.input = '4000.01';
  const accepted = validateDraft(draft);
  expect(accepted.error).toBeUndefined();
  expect(accepted.totals?.incomeOere).toBe(2500051);
  const reopened = validateDraft(createDraft(JSON.parse(JSON.stringify(accepted.plan))));
  expect(reopened).toEqual(accepted);
  expect(reopened.plan?.pots[0]!.rows[0]!.amountOere).toBe(800010);
  expect(reopened.plan?.pots[1]!.rows[0]!.amountOere).toBe(700020);
  expect(reopened.plan?.pots[2]!.rows[0]!.amountOere).toBe(400001);
});
