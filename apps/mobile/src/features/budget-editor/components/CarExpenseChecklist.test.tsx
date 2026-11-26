import { fireEvent, render, screen } from '@testing-library/react-native';
import type { BillSuggestions } from '@budget-builder/contracts';
import { manualPlan } from '../../budget-creation/api';
import { billSuggestions } from '../../../tests/billSuggestionFixtures';
import { BudgetEditor } from './BudgetEditor';

const press = (name: string) => fireEvent.press(screen.getByRole('button', { name }));
const labels = [
  'Vehicle tax / ejerafgift',
  'Car insurance',
  'Fuel / charging',
  'Service / repairs',
  'Tyre changes',
  'Vehicle inspection / syn',
];
const yes = () => fireEvent.press(screen.getByRole('radio', { name: 'Yes, I have a car' }));
async function mount(data: BillSuggestions = billSuggestions()) {
  const load = jest.fn(async (_signal: AbortSignal) => data);
  const save = jest.fn();
  const view = await render(
    <BudgetEditor
      initialPlan={manualPlan()}
      startBlank
      creationStep="allocate"
      loadBillSuggestions={load}
      onSubmit={save}
    />,
  );
  await fireEvent.changeText(screen.getByLabelText('Budget name'), 'Car plan');
  await fireEvent.changeText(screen.getByLabelText('Income row 1 amount in DKK'), '20000');
  return { load, save, view };
}
async function skipMissing(except?: string) {
  for (const label of labels) {
    const skip = screen.queryByRole('radio', { name: `${label}: Skip this cost` });
    if (skip && label !== except) await fireEvent.press(skip);
  }
}

it('US-04: requires an explicit car answer before discovery and cancellation changes nothing', async () => {
  const { load } = await mount();
  await press('Create Auto Budget');
  expect(screen.getByText('Do you have a car?')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled();
  expect(screen.getByRole('radio', { name: 'Yes, I have a car' })).not.toBeChecked();
  expect(screen.getByRole('radio', { name: 'No, I do not have a car' })).not.toBeChecked();
  await yes();
  expect(screen.getByRole('button', { name: 'Confirm' })).toBeEnabled();
  expect(load).not.toHaveBeenCalled();
  await press('Cancel');
  expect(screen.getByLabelText('Groceries row 1 amount in DKK')).toHaveDisplayValue('');
});

it('US-04/05: keeps detected half-yearly tax, adds a monthly syn reserve and uses the fallback before saving', async () => {
  const data = billSuggestions();
  data.suggestions = [
    data.suggestions[0]!,
    {
      ...data.suggestions[1]!,
      label: 'Grøn ejerafgift',
      amountOere: 120000,
      frequency: 'HALF_YEARLY',
      match: { merchantKeys: ['payee:vehicle tax authority'] },
    },
  ];
  const { view, load, save } = await mount(data);
  await press('Create Auto Budget');
  await yes();
  await press('Confirm');
  expect(await screen.findByRole('header', { name: 'Your car expenses' })).toBeVisible();
  expect(screen.getByText('Already included: Grøn ejerafgift')).toBeVisible();
  expect(
    screen.getByRole('button', {
      name: 'Vehicle tax / ejerafgift included bill 1 frequency: Every 6 months',
    }),
  ).toBeVisible();
  expect(save).not.toHaveBeenCalled();
  await skipMissing('Vehicle inspection / syn');
  await fireEvent.changeText(
    screen.getByLabelText('Vehicle inspection / syn amount in DKK'),
    '2000',
  );
  await press('Allocate budget');
  expect(await screen.findByText(/Auto allocation applied using 85\/5\/10/)).toBeVisible();
  expect(screen.getByLabelText('Groceries row 1 amount in DKK')).toHaveDisplayValue('6.800');
  expect(screen.getByLabelText('Fun budget row 1 amount in DKK')).toHaveDisplayValue('1.000');
  expect(save).not.toHaveBeenCalled();
  await press('Next');
  await view.rerender(
    <BudgetEditor
      initialPlan={manualPlan()}
      startBlank
      creationStep="review"
      loadBillSuggestions={load}
      onSubmit={save}
    />,
  );
  expect(screen.getByText('Monthly planning reserve')).toBeVisible();
  await press('Create budget');
  const rows = save.mock.calls[0]![0].pots.find(
    (pot: { type: string }) => pot.type === 'FIXED_EXPENSE',
  ).rows;
  expect(rows).toHaveLength(3);
  expect(rows.find((row: { label: string }) => row.label === 'Grøn ejerafgift').frequency).toBe(
    'HALF_YEARLY',
  );
  expect(
    rows.find((row: { carExpense?: { kind: string } }) => row.carExpense?.kind === 'INSPECTION'),
  ).toEqual(
    expect.objectContaining({
      amountOere: 200000,
      frequency: 'MONTHLY',
      carExpense: { kind: 'INSPECTION', basis: 'MONTHLY_RESERVE' },
    }),
  );
});

it('US-10: missing car costs need input or explicit skipping; cancel retains the original draft', async () => {
  await mount();
  await press('Create Auto Budget');
  await yes();
  await press('Confirm');
  await screen.findByRole('header', { name: 'Your car expenses' });
  expect(screen.getByLabelText('Vehicle tax / ejerafgift amount in DKK')).toHaveDisplayValue('');
  await press('Allocate budget');
  expect(screen.getByText(/Enter an amount for Vehicle tax/)).toBeVisible();
  await press('Cancel');
  expect(screen.getByLabelText('Groceries row 1 amount in DKK')).toHaveDisplayValue('');
  expect(screen.getByRole('button', { name: 'Add bills to Fixed expenses' })).toBeVisible();
});

it('US-04: repeated runs include the accepted car reserve once without asking for its amount again', async () => {
  await mount();
  await press('Create Auto Budget');
  await yes();
  await press('Confirm');
  await screen.findByRole('header', { name: 'Your car expenses' });
  await skipMissing('Vehicle inspection / syn');
  await fireEvent.changeText(
    screen.getByLabelText('Vehicle inspection / syn amount in DKK'),
    '100',
  );
  await press('Allocate budget');
  await press('Create Auto Budget');
  await yes();
  await press('Confirm');
  await screen.findByRole('header', { name: 'Your car expenses' });
  expect(screen.getByText('Already included: Vehicle inspection / syn reserve')).toBeVisible();
  expect(screen.queryByLabelText('Vehicle inspection / syn amount in DKK')).toBeNull();
  await skipMissing();
  await press('Allocate budget');
  expect(screen.getByLabelText('Groceries row 1 amount in DKK')).toHaveDisplayValue('1.801');
});
