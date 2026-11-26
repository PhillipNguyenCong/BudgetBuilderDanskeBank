import { manualPlan } from '../../budget-creation/api';
import { billSuggestions } from '../../../tests/billSuggestionFixtures';
import { createDraft, draftRow, validateDraft } from './draft';
import { createAutoAllocationDraft } from './autoAllocation';
import { createCarChecklist, applyCarChecklist } from './carChecklist';

function draft() {
  const value = createDraft(manualPlan());
  value.name = 'Car budget';
  value.widgets[0]!.rows[0]!.input = '20000';
  return value;
}

it('US-04/05: missing car costs are blank, must be completed or skipped, and reserves affect the split', () => {
  const value = draft();
  const checklist = createCarChecklist(value);
  expect(checklist).toHaveLength(6);
  expect(() => applyCarChecklist(value, checklist)).toThrow(/amount|skip/i);
  const selected = checklist.map((item) => ({
    ...item,
    include: item.kind === 'INSPECTION',
    row: { ...item.row, input: item.kind === 'INSPECTION' ? '200' : '' },
  }));
  const withCar = applyCarChecklist(value, selected);
  const data = billSuggestions();
  data.suggestions = [{ ...data.suggestions[0]!, amountOere: 990000 }];
  const result = createAutoAllocationDraft(withCar, data, []);
  expect(result.allocation.split).toBe('85/5/10');
  expect(result.allocation.fixedExpensesOere).toBe(1010000);
  expect(validateDraft(result.draft).plan?.pots[0]!.rows[0]).toEqual(
    expect.objectContaining({
      amountOere: 20000,
      frequency: 'MONTHLY',
      carExpense: { kind: 'INSPECTION', basis: 'MONTHLY_RESERVE' },
    }),
  );
  expect(value.widgets[1]!.rows).toHaveLength(0);
});

it('US-04: recognized bills and renamed reserves are preserved without duplicates on repeated runs', () => {
  const value = draft();
  value.widgets[1]!.rows = [
    draftRow({ id: 'tax', label: 'Grøn ejerafgift', amountOere: 240000, frequency: 'HALF_YEARLY' }),
    draftRow({
      id: 'syn',
      label: 'Renamed reserve',
      amountOere: 10000,
      carExpense: { kind: 'INSPECTION', basis: 'MONTHLY_RESERVE' },
    }),
  ];
  const checklist = createCarChecklist(value);
  expect(checklist.find((item) => item.kind === 'VEHICLE_TAX')!.existingRows[0]!.frequency).toBe(
    'HALF_YEARLY',
  );
  expect(checklist.find((item) => item.kind === 'INSPECTION')!.existingRows).toHaveLength(1);
  const selected = checklist.map((item) => ({ ...item, include: false }));
  const result = applyCarChecklist(value, selected);
  expect(result.widgets[1]!.rows[0]).toEqual(
    expect.objectContaining({
      id: 'tax',
      amountOere: 240000,
      frequency: 'HALF_YEARLY',
      input: '2400',
    }),
  );
  expect(result.widgets[1]!.rows[1]).toBe(value.widgets[1]!.rows[1]);
  expect(
    applyCarChecklist(
      result,
      createCarChecklist(result).map((item) => ({ ...item, include: false })),
    ).widgets[1]!.rows,
  ).toHaveLength(2);
});

it('US-04/10: existing missing car amounts can be completed without replacing labels or source evidence', () => {
  const value = draft();
  const row = draftRow({
    id: 'tax',
    label: 'Grøn ejerafgift',
    amountOere: 0,
    frequency: 'HALF_YEARLY',
    source: {
      kind: 'SUGGESTED',
      recordIds: ['tax-record'],
      explanation: 'Amount unavailable.',
      period: null,
    },
    originalSuggestion: { label: 'Grøn ejerafgift', amountOere: null, frequency: 'HALF_YEARLY' },
  });
  value.widgets[1]!.rows = [{ ...row, input: '', originalInput: '' }];
  const items = createCarChecklist(value).map((item) => ({ ...item, include: false }));
  expect(() => applyCarChecklist(value, items)).toThrow(/Enter the amount/);
  const tax = items.find((item) => item.kind === 'VEHICLE_TAX')!;
  tax.existingRows = tax.existingRows.map((existing) => ({ ...existing, input: '1200' }));
  const result = validateDraft(applyCarChecklist(value, items));
  expect(result.plan?.pots[0]!.rows[0]).toEqual(
    expect.objectContaining({
      amountOere: 120000,
      label: 'Grøn ejerafgift',
      frequency: 'HALF_YEARLY',
      source: row.source,
      originalSuggestion: row.originalSuggestion,
      adjustedByUser: true,
    }),
  );
});
