import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { BillSuggestions } from '@budget-builder/contracts';
import { manualPlan } from '../../budget-creation/api';
import { billSuggestions } from '../../../tests/billSuggestionFixtures';
import { BudgetEditor } from './BudgetEditor';
import { createDraft, isAdjusted } from '../editor/draft';
import { remainingBillSuggestions } from '../editor/suggestedBills';

async function openBills() {
  await fireEvent.press(screen.getByRole('button', { name: 'Add bills to Fixed expenses' }));
}
function deferred() {
  let finish!: (value: BillSuggestions) => void;
  const load = jest.fn(
    (_signal: AbortSignal) =>
      new Promise<BillSuggestions>((resolve) => {
        finish = resolve;
      }),
  );
  return { load, finish: async () => act(() => finish(billSuggestions())) };
}

it('US-04: fetches on first Add bills only, inserts editable draft suggestions and saves matching evidence after rename', async () => {
  const load = jest.fn(async (_signal: AbortSignal) => billSuggestions());
  const submit = jest.fn();
  await render(
    <BudgetEditor
      initialPlan={manualPlan()}
      startBlank
      loadBillSuggestions={load}
      onSubmit={submit}
    />,
  );
  expect(load).not.toHaveBeenCalled();
  await fireEvent.changeText(screen.getByLabelText('Budget name'), 'My suggested bills');
  for (const [name, amount] of [
    ['Monthly salary', '24000'],
    ['Spending budget', '8000'],
    ['Savings', '4000'],
  ])
    await fireEvent.changeText(screen.getByLabelText(`${name} row 1 amount in DKK`), amount);
  await openBills();
  expect(screen.getByLabelText('Fixed expenses row 1 label')).toHaveDisplayValue('Rent');
  expect(screen.getByLabelText('Fixed expenses row 1 amount in DKK')).toHaveDisplayValue('8000');
  expect(screen.getByLabelText('Fixed expenses row 2 label')).toHaveDisplayValue('Netflix');
  expect(submit).not.toHaveBeenCalled();
  await fireEvent.changeText(screen.getByLabelText('Fixed expenses row 1 label'), 'Husleje');
  await fireEvent.press(screen.getByRole('button', { name: 'Done' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Edit bills to Fixed expenses' }));
  expect(load).toHaveBeenCalledTimes(1);
  expect(screen.getByLabelText('Fixed expenses row 1 label')).toHaveDisplayValue('Husleje');
  await fireEvent.press(screen.getByRole('button', { name: 'Done' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Create budget' }));
  const fixed = submit.mock.calls[0]![0].pots.find(
    (pot: { type: string }) => pot.type === 'FIXED_EXPENSE',
  );
  expect(fixed.rows[0]).toEqual(
    expect.objectContaining({
      label: 'Husleje',
      amountOere: 800000,
      match: { merchantKeys: ['known:rent'] },
      originalSuggestion: { label: 'Rent', amountOere: 800000, frequency: 'MONTHLY' },
      adjustedByUser: true,
    }),
  );
});

it('US-04: late results cannot replace manual bill entries; results can be explicitly merged once', async () => {
  const pending = deferred();
  await render(
    <BudgetEditor initialPlan={manualPlan()} startBlank loadBillSuggestions={pending.load} />,
  );
  await openBills();
  expect(
    screen.getByText('Looking for bills… You can add bills manually while we look.'),
  ).toBeVisible();
  await fireEvent.press(screen.getByRole('button', { name: 'Add bill to Fixed expenses' }));
  await fireEvent.changeText(screen.getByLabelText('Fixed expenses row 1 label'), 'My custom bill');
  await pending.finish();
  expect(screen.getByLabelText('Fixed expenses row 1 label')).toHaveDisplayValue('My custom bill');
  expect(screen.queryByLabelText('Fixed expenses row 2 label')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Add found bills' }));
  expect(screen.getByLabelText('Fixed expenses row 2 label')).toHaveDisplayValue('Rent');
  expect(screen.getByRole('button', { name: 'Add found bills' })).toBeDisabled();
});

it('US-04: closing while loading caches results without adding hidden amounts', async () => {
  const pending = deferred();
  await render(
    <BudgetEditor initialPlan={manualPlan()} startBlank loadBillSuggestions={pending.load} />,
  );
  await openBills();
  await fireEvent.press(screen.getByRole('button', { name: 'Close' }));
  await pending.finish();
  expect(screen.getByRole('button', { name: 'Add bills to Fixed expenses' })).toBeVisible();
  await openBills();
  expect(pending.load).toHaveBeenCalledTimes(1);
  expect(screen.queryByLabelText('Fixed expenses row 1 label')).toBeNull();
  expect(screen.getByRole('button', { name: 'Add found bills' })).toBeEnabled();
});

it('US-04: removal and refresh preserve customer choices without duplicate/reinserted rows', async () => {
  const load = jest.fn(async (_signal: AbortSignal) => billSuggestions());
  await render(<BudgetEditor initialPlan={manualPlan()} startBlank loadBillSuggestions={load} />);
  await openBills();
  await fireEvent.press(screen.getByRole('button', { name: 'Remove Fixed expenses row 1' }));
  await fireEvent.changeText(screen.getByLabelText('Fixed expenses row 1 amount in DKK'), '109');
  await fireEvent.press(screen.getByRole('button', { name: 'Refresh bill suggestions' }));
  expect(load).toHaveBeenCalledTimes(2);
  expect(screen.getByLabelText('Fixed expenses row 1 label')).toHaveDisplayValue('Netflix');
  expect(screen.getByLabelText('Fixed expenses row 1 amount in DKK')).toHaveDisplayValue('109');
  expect(screen.queryByLabelText('Fixed expenses row 2 label')).toBeNull();
});

it('US-10: failed detection and no results retain manual entry and permit explicit retry', async () => {
  const load = jest
    .fn()
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce({ ...billSuggestions(), suggestions: [] });
  await render(<BudgetEditor initialPlan={manualPlan()} startBlank loadBillSuggestions={load} />);
  await openBills();
  expect(
    screen.getByText('Could not find bills right now. You can still add bills manually.'),
  ).toBeVisible();
  expect(screen.getByRole('button', { name: 'Add bill to Fixed expenses' })).toBeEnabled();
  await fireEvent.press(screen.getByRole('button', { name: 'Try finding bills again' }));
  expect(
    screen.getByText('No recurring bills found. Add any bills you know about below.'),
  ).toBeVisible();
});

it('US-04: leaving the account draft aborts detection and ignores its late result', async () => {
  const pending = deferred();
  const view = await render(
    <BudgetEditor initialPlan={manualPlan()} startBlank loadBillSuggestions={pending.load} />,
  );
  await openBills();
  const signal = pending.load.mock.calls[0]![0];
  await view.unmount();
  expect(signal.aborted).toBe(true);
  await pending.finish();
});

it('US-10: a possible bill with unknown amount/frequency stays incomplete until explicitly reviewed', async () => {
  const data = billSuggestions();
  data.suggestions = [
    {
      ...data.suggestions[0]!,
      confidence: 'POSSIBLE',
      amountOere: null,
      frequency: null,
      source: {
        ...data.suggestions[0]!.source,
        explanation:
          'A recurring planned payment was found; amount and frequency need confirmation.',
      },
    },
  ];
  const load = jest.fn(async () => data);
  const submit = jest.fn();
  await render(
    <BudgetEditor
      initialPlan={manualPlan()}
      startBlank
      loadBillSuggestions={load}
      onSubmit={submit}
    />,
  );
  await fireEvent.changeText(screen.getByLabelText('Budget name'), 'Reviewed suggestions');
  for (const [name, amount] of [
    ['Monthly salary', '24000'],
    ['Spending budget', '8000'],
    ['Savings', '4000'],
  ])
    await fireEvent.changeText(screen.getByLabelText(`${name} row 1 amount in DKK`), amount);
  await openBills();
  expect(screen.queryByLabelText('Fixed expenses row 1 label')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Add found bills' }));
  expect(screen.getByLabelText('Fixed expenses row 1 amount in DKK')).toHaveDisplayValue('');
  expect(screen.getByText('Original suggestion: Rent, amount unavailable')).toBeVisible();
  await fireEvent.changeText(screen.getByLabelText('Fixed expenses row 1 amount in DKK'), '1000');
  await fireEvent.press(
    screen.getByRole('button', { name: 'Fixed expenses row 1 frequency: Needs confirmation' }),
  );
  expect(screen.getByRole('radio', { name: 'Fixed expenses row 1: Monthly' })).not.toBeChecked();
  await fireEvent.press(screen.getByRole('radio', { name: 'Fixed expenses row 1: Monthly' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Done' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Create budget' }));
  const row = submit.mock.calls[0]![0].pots.find(
    (pot: { type: string }) => pot.type === 'FIXED_EXPENSE',
  ).rows[0];
  expect(row.amountOere).toBe(100000);
  expect(row.frequency).toBe('MONTHLY');
  expect(row.originalSuggestion).toEqual({ label: 'Rent', amountOere: null, frequency: null });
  const reopened = createDraft(submit.mock.calls[0]![0]).widgets.find(
    (widget) => widget.type === 'FIXED_EXPENSE',
  )!.rows[0]!;
  expect(reopened.sourceAmountKnown).toBe(false);
  expect(reopened.sourceFrequencyKnown).toBe(false);
  expect(reopened.needsFrequencyReview).toBeUndefined();
  expect(isAdjusted(reopened)).toBe(true);
});

it('US-04: generic descriptions do not hide another named payee when a bill is included or removed', () => {
  const data = billSuggestions();
  const first = {
    ...data.suggestions[0]!,
    match: { merchantKeys: ['payee:provider a', 'description:direct debit'] },
  };
  const second = {
    ...data.suggestions[1]!,
    match: { merchantKeys: ['payee:provider b', 'description:direct debit'] },
  };
  const plan = manualPlan();
  const fixed = plan.pots.find((pot) => pot.type === 'FIXED_EXPENSE')!;
  fixed.rows = [
    { id: first.id, label: first.label, amountOere: first.amountOere!, match: first.match },
  ];
  expect(remainingBillSuggestions(createDraft(plan), [first, second], []).map((s) => s.id)).toEqual(
    [second.id],
  );
  fixed.rows = [];
  expect(
    remainingBillSuggestions(createDraft(plan), [first, second], ['payee:provider a']).map(
      (s) => s.id,
    ),
  ).toEqual([second.id]);
});

it('US-04: a manually entered Husleje row is not duplicated by a Rent suggestion', async () => {
  const pending = deferred();
  await render(
    <BudgetEditor initialPlan={manualPlan()} startBlank loadBillSuggestions={pending.load} />,
  );
  await openBills();
  await fireEvent.press(screen.getByRole('button', { name: 'Add bill to Fixed expenses' }));
  await fireEvent.changeText(screen.getByLabelText('Fixed expenses row 1 label'), 'Husleje');
  await pending.finish();
  await fireEvent.press(screen.getByRole('button', { name: 'Add found bills' }));
  expect(screen.getByLabelText('Fixed expenses row 1 label')).toHaveDisplayValue('Husleje');
  expect(screen.getByLabelText('Fixed expenses row 2 label')).toHaveDisplayValue('Netflix');
  expect(screen.queryByLabelText('Fixed expenses row 3 label')).toBeNull();
});
