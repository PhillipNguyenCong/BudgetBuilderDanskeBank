import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { BillSuggestions } from '@budget-builder/contracts';
import { manualPlan } from '../../budget-creation/api';
import { billSuggestions } from '../../../tests/billSuggestionFixtures';
import { BudgetEditor } from './BudgetEditor';

const press = async (name: string) => {
  if (name === 'Confirm') {
    const noCar = screen.queryByRole('radio', { name: 'No, I do not have a car' });
    if (noCar) await fireEvent.press(noCar);
  }
  await fireEvent.press(screen.getByRole('button', { name }));
};
const edit = (name: string, amount: string) =>
  fireEvent.changeText(screen.getByLabelText(`${name} row 1 amount in DKK`), amount);
async function mount(load = jest.fn(async (_signal: AbortSignal) => billSuggestions())) {
  const submit = jest.fn();
  const view = await render(
    <BudgetEditor
      initialPlan={manualPlan()}
      startBlank
      creationStep="allocate"
      loadBillSuggestions={load}
      onSubmit={submit}
    />,
  );
  await fireEvent.changeText(screen.getByLabelText('Budget name'), 'My auto budget');
  await edit('Income', '20000');
  return { view, load, submit };
}

it('US-04: requires confirmation before discovery, and Cancel preserves all inputs', async () => {
  const { load, submit } = await mount();
  for (const name of ['Income', 'Groceries', 'Fun budget', 'Savings'])
    expect(screen.getByLabelText(`${name} row 1 amount in DKK`)).toBeVisible();
  await edit('Savings', '500');
  await press('Create Auto Budget');
  expect(screen.getByRole('header', { name: 'Create Auto Budget?' })).toBeVisible();
  expect(load).not.toHaveBeenCalled();
  expect(screen.getByText(/50\/30\/20: bills and groceries/)).toBeVisible();
  expect(screen.getByText(/switch to 85\/5\/10/)).toBeVisible();
  await press('Cancel');
  expect(screen.getByLabelText('Savings row 1 amount in DKK')).toHaveDisplayValue('500');
  expect(screen.getByLabelText('Groceries row 1 amount in DKK')).toHaveDisplayValue('');
  expect(submit).not.toHaveBeenCalled();
});

it('US-03/04: Confirm fills the entire draft, updates guidance and still requires explicit saving', async () => {
  const data = billSuggestions();
  data.suggestions = [{ ...data.suggestions[0]!, confidence: 'POSSIBLE' }];
  const { view, load, submit } = await mount(jest.fn(async (_signal: AbortSignal) => data));
  await press('Create Auto Budget');
  await press('Confirm');
  expect(await screen.findByText(/Auto allocation applied using 50\/30\/20/)).toBeVisible();
  expect(screen.queryByTestId('auto-budget-confirmation')).toBeNull();
  expect(screen.getByLabelText('Groceries row 1 amount in DKK')).toHaveDisplayValue('2.000');
  expect(screen.getByLabelText('Fun budget row 1 amount in DKK')).toHaveDisplayValue('6.000');
  expect(screen.getByLabelText('Savings row 1 amount in DKK')).toHaveDisplayValue('4.000');
  expect(
    screen.getByText('1 possible bill included. Review them in Fixed expenses before saving.'),
  ).toBeVisible();
  expect(screen.getByText('0 kr.')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();
  expect(submit).not.toHaveBeenCalled();
  await press('Create Auto Budget');
  await press('Confirm');
  expect(load).toHaveBeenCalledTimes(1);
  await press('Next');
  await view.rerender(
    <BudgetEditor
      initialPlan={manualPlan()}
      startBlank
      creationStep="review"
      loadBillSuggestions={load}
      onSubmit={submit}
    />,
  );
  expect(screen.getAllByRole('radio', { name: /Keep unallocated/ })).toHaveLength(2);
  expect(screen.getByText('Possible bill · review before saving')).toBeVisible();
  await press('Create budget');
  expect(submit).toHaveBeenCalledTimes(1);
  expect(submit.mock.calls[0]![0].pots.map((p: { name: string }) => p.name)).toEqual([
    'Fixed expenses',
    'Groceries',
    'Fun budget',
    'Savings',
  ]);
});

it.each([
  [1200000, '5.000'],
  [1300000, '4.000'],
  [1400000, '3.000'],
  [1700000, '0'],
])('US-04: bills %i use the automatic 85/5/10 fallback', async (amountOere, groceries) => {
  const data = billSuggestions();
  data.suggestions = [{ ...data.suggestions[0]!, amountOere }];
  await mount(jest.fn(async (_signal: AbortSignal) => data));
  await press('Create Auto Budget');
  await press('Confirm');
  expect(await screen.findByText(/Auto allocation applied using 85\/5\/10/)).toBeVisible();
  expect(screen.getByLabelText('Groceries row 1 amount in DKK')).toHaveDisplayValue(groceries);
  expect(screen.getByLabelText('Fun budget row 1 amount in DKK')).toHaveDisplayValue('1.000');
  expect(screen.getByLabelText('Savings row 1 amount in DKK')).toHaveDisplayValue('2.000');
  if (groceries === '0') expect(screen.getByText(/Groceries is zero/)).toBeVisible();
  await edit('Savings', '123');
  expect(screen.queryByText(/Auto allocation applied using/)).toBeNull();
  expect(screen.queryByText(/Groceries is zero/)).toBeNull();
  expect(screen.getByLabelText('Savings row 1 amount in DKK')).toHaveDisplayValue('123');
  expect(screen.getByLabelText('Fun budget row 1 amount in DKK')).toHaveDisplayValue('1.000');
});

it('US-10: excessive or incomplete bills leave the entire draft unchanged', async () => {
  const data = billSuggestions();
  data.suggestions[0]!.amountOere = 1800000;
  const { load } = await mount(jest.fn(async (_signal: AbortSignal) => data));
  await edit('Savings', '123');
  await press('Create Auto Budget');
  await press('Confirm');
  expect(await screen.findByText(/Your monthly bills exceed 85%/)).toBeVisible();
  await press('Cancel');
  expect(screen.getByLabelText('Savings row 1 amount in DKK')).toHaveDisplayValue('123');
  expect(screen.getByLabelText('Groceries row 1 amount in DKK')).toHaveDisplayValue('');
  expect(screen.getByRole('button', { name: 'Add bills to Fixed expenses' })).toBeVisible();
  expect(load).toHaveBeenCalledTimes(1);
});

it('US-10: failed discovery can retry without saving or dropping manual input', async () => {
  const load = jest.fn(async (_signal: AbortSignal) => billSuggestions());
  load.mockRejectedValueOnce(new Error('offline'));
  await mount(load);
  await press('Create Auto Budget');
  await press('Confirm');
  expect(await screen.findByText(/Could not find bills right now/)).toBeVisible();
  await press('Try again');
  expect(await screen.findByText(/Auto allocation applied using 50\/30\/20/)).toBeVisible();
  expect(load).toHaveBeenCalledTimes(2);
});

it('US-04: cancelling discovery still allows the first Add bills tap to discover bills', async () => {
  const load = jest.fn((_signal: AbortSignal) => new Promise<BillSuggestions>(() => {}));
  await mount(load);
  await press('Create Auto Budget');
  await press('Confirm');
  await press('Cancel allocation');
  load.mockImplementation(async () => billSuggestions());
  await press('Add bills to Fixed expenses');
  expect(await screen.findByLabelText('Fixed expenses row 1 label')).toHaveDisplayValue('Rent');
  expect(load).toHaveBeenCalledTimes(2);
});

it('US-04/05: auto allocation defaults missing bill frequency to Monthly without another confirmation', async () => {
  const data = billSuggestions();
  data.suggestions = [{ ...data.suggestions[0]!, frequency: null }];
  await mount(jest.fn(async (_signal: AbortSignal) => data));
  await press('Create Auto Budget');
  await press('Confirm');
  expect(await screen.findByText(/Auto allocation applied using 50\/30\/20/)).toBeVisible();
  expect(screen.getByLabelText('Groceries row 1 amount in DKK')).toHaveDisplayValue('2.000');
  await press('Edit bills to Fixed expenses');
  expect(
    screen.getByRole('button', { name: 'Fixed expenses row 1 frequency: Monthly' }),
  ).toBeVisible();
  expect(screen.queryByText('Confirm frequency')).toBeNull();
});

it('US-10: missing bill amounts leave the draft unchanged and can be completed before retry', async () => {
  const data = billSuggestions();
  data.suggestions = [
    { ...data.suggestions[0]!, confidence: 'POSSIBLE', amountOere: null, frequency: null },
  ];
  const { load } = await mount(jest.fn(async (_signal: AbortSignal) => data));
  await press('Create Auto Budget');
  await press('Confirm');
  expect(await screen.findByText(/Some bills need an amount or name/)).toBeVisible();
  await press('Cancel');
  expect(screen.getByLabelText('Groceries row 1 amount in DKK')).toHaveDisplayValue('');
  await press('Add bills to Fixed expenses');
  await press('Add found bills');
  expect(screen.getByText('Possible bill · review before saving')).toBeVisible();
  await edit('Fixed expenses', '8000');
  expect(
    screen.getByRole('button', { name: 'Fixed expenses row 1 frequency: Monthly' }),
  ).toBeVisible();
  await press('Close');
  await press('Create Auto Budget');
  await press('Confirm');
  expect(await screen.findByText(/Auto allocation applied using 50\/30\/20/)).toBeVisible();
  expect(screen.getByLabelText('Groceries row 1 amount in DKK')).toHaveDisplayValue('2.000');
  expect(load).toHaveBeenCalledTimes(1);
});

it('US-04: pending allocation blocks duplicate runs; cancellation ignores late results and permits retry', async () => {
  let finish!: (data: BillSuggestions) => void;
  const load = jest.fn(
    (_signal: AbortSignal) =>
      new Promise<BillSuggestions>((resolve) => {
        finish = resolve;
      }),
  );
  await mount(load);
  await press('Create Auto Budget');
  await press('Confirm');
  expect(await screen.findByText('Finding bills and allocating your budget…')).toBeVisible();
  expect(screen.queryByRole('button', { name: 'Confirm' })).toBeNull();
  await press('Cancel allocation');
  expect(load.mock.calls[0]![0].aborted).toBe(true);
  await act(() => finish(billSuggestions()));
  expect(screen.queryByText(/Auto allocation applied/)).toBeNull();
  expect(screen.getByLabelText('Groceries row 1 amount in DKK')).toHaveDisplayValue('');
  load.mockImplementation(async () => billSuggestions());
  await press('Create Auto Budget');
  await press('Confirm');
  expect(await screen.findByText(/Auto allocation applied using 50\/30\/20/)).toBeVisible();
  expect(load).toHaveBeenCalledTimes(2);
});

it('US-04: leaving the draft aborts auto allocation even when the loader resolves later', async () => {
  let finish!: (data: BillSuggestions) => void;
  const load = jest.fn(
    (_signal: AbortSignal) =>
      new Promise<BillSuggestions>((resolve) => {
        finish = resolve;
      }),
  );
  const { view, submit } = await mount(load);
  await press('Create Auto Budget');
  await press('Confirm');
  await view.unmount();
  expect(load.mock.calls[0]![0].aborted).toBe(true);
  await act(() => finish(billSuggestions()));
  expect(submit).not.toHaveBeenCalled();
});
