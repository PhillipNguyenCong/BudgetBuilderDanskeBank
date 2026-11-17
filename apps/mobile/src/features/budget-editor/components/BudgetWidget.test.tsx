import { fireEvent, render, screen } from '@testing-library/react-native';
import { manualPlan } from '../../budget-creation/api';
import { BudgetEditor } from './BudgetEditor';

const press = async (name: string) => {
  if (name === 'Done') {
    const next = screen.queryByRole('button', { name: 'Next' });
    if (next) await fireEvent.press(next);
    const ok = screen.queryByRole('button', { name: 'OK' });
    if (ok) await fireEvent.press(ok);
  }
  await fireEvent.press(screen.getByRole('button', { name }));
};
const amount = (value: string, row = 1) =>
  fireEvent.changeText(screen.getByLabelText(`Fixed expenses row ${row} amount in DKK`), value);

it('US-04: switches Add bills to a total, preserves incomplete input, and restores entry after clearing or removing bills', async () => {
  await render(<BudgetEditor initialPlan={manualPlan()} startBlank />);
  expect(screen.getByRole('button', { name: 'Add bills to Fixed expenses' })).toBeVisible();
  await press('Add bills to Fixed expenses');
  expect(screen.getByText('No amounts entered')).toBeVisible();
  expect(screen.getByRole('header', { name: 'Bills' })).toBeVisible();
  await press('Add bill to Fixed expenses');
  await amount('0');
  await press('Done');
  expect(screen.queryByRole('button', { name: 'Add bills to Fixed expenses' })).toBeNull();
  expect(screen.getByText('0 kr.')).toBeVisible();
  await press('Edit bills to Fixed expenses');
  await amount('1000');
  await press('Add bill to Fixed expenses');
  await press('Done');
  expect(screen.getByText('Amount incomplete')).toBeVisible();
  await press('Edit bills to Fixed expenses');
  await amount('500', 2);
  await press('Done');
  expect(screen.getByText('1.500 kr.')).toBeVisible();
  await press('Edit bills to Fixed expenses');
  await amount('-1', 2);
  await press('Done');
  expect(screen.getByText('1.500 kr.')).toBeVisible();
  await press('Edit bills to Fixed expenses');
  expect(screen.getByLabelText('Fixed expenses row 2 amount in DKK')).toHaveDisplayValue('500');
  await amount('');
  await amount('', 2);
  await press('Done');
  expect(screen.getByRole('button', { name: 'Add bills to Fixed expenses' })).toBeVisible();
  await press('Add bills to Fixed expenses');
  await press('Remove Fixed expenses row 2');
  await press('Remove Fixed expenses row 1');
  await press('Done');
  expect(screen.getByRole('button', { name: 'Add bills to Fixed expenses' })).toBeVisible();
  await press('Add bills to Fixed expenses');
  expect(screen.getByText('No bills yet. Add a bill to plan an amount.')).toBeVisible();
});

it('US-04: frequency changes preserve payment text and update the monthly total and remainder', async () => {
  const submit = jest.fn();
  const plan = manualPlan();
  plan.name = 'Frequency plan';
  plan.pots.find((pot) => pot.type === 'FIXED_EXPENSE')!.rows = [
    { id: 'rent', label: 'Rent', amountOere: 0 },
  ];
  plan.income.rows[0]!.amountOere = 100000;
  await render(<BudgetEditor initialPlan={plan} onSubmit={submit} />);
  await press('Edit bills to Fixed expenses');
  await amount('3600');
  await fireEvent(screen.getByLabelText('Fixed expenses row 1 amount in DKK'), 'blur');
  await press('Fixed expenses row 1 frequency: Monthly');
  expect(screen.getByRole('radio', { name: 'Fixed expenses row 1: Monthly' })).toBeChecked();
  await fireEvent.press(screen.getByRole('radio', { name: 'Fixed expenses row 1: Yearly' }));
  expect(screen.queryByRole('radio', { name: 'Fixed expenses row 1: Yearly' })).toBeNull();
  expect(screen.getByLabelText('Fixed expenses row 1 amount in DKK')).toHaveDisplayValue('3600');
  expect(screen.getByText('300 kr./month')).toBeVisible();
  expect(screen.getByText('700 kr. left to allocate')).toBeVisible();
  expect(screen.getByText('Set aside per month')).toBeVisible();
  await press('Done');
  expect(screen.getByText('300 kr.')).toBeVisible();
  await press('Create budget');
  expect(
    submit.mock.calls[0][0].pots.find((pot: { type: string }) => pot.type === 'FIXED_EXPENSE')
      .rows[0],
  ).toEqual(expect.objectContaining({ amountOere: 360000, frequency: 'YEARLY' }));
  await press('Edit bills to Fixed expenses');
  expect(
    screen.getByRole('button', { name: 'Fixed expenses row 1 frequency: Yearly' }),
  ).toBeVisible();
  await amount('');
  expect(screen.queryByText('300 kr./month')).toBeNull();
  await amount('-1');
  expect(screen.getByText('Amount not entered')).toBeVisible();
});

it('formats idle amounts with Danish separators and preserves exact input while editing', async () => {
  const plan = manualPlan();
  plan.income.rows[0]!.amountOere = 3125050;
  await render(<BudgetEditor initialPlan={plan} />);
  const input = screen.getByLabelText('Monthly salary row 1 amount in DKK');
  expect(input).toHaveDisplayValue('31.250,50');
  await fireEvent(input, 'focus');
  expect(input).toHaveDisplayValue('31250.50');
  await fireEvent.changeText(input, '32000,75');
  await fireEvent(input, 'blur');
  expect(input).toHaveDisplayValue('32.000,75');
  await fireEvent(input, 'focus');
  expect(input).toHaveDisplayValue('32000,75');
});

it('keeps an empty quiet amount unknown and opens editing without inventing a zero', async () => {
  await render(<BudgetEditor initialPlan={manualPlan()} startBlank />);
  const input = screen.getByLabelText('Spending budget row 1 amount in DKK');
  expect(input).toHaveDisplayValue('');
  expect(input.props.placeholder).toBe('Angiv beløb');
  await fireEvent(input, 'focus');
  await fireEvent.changeText(input, '0');
  await fireEvent(input, 'blur');
  expect(input).toHaveDisplayValue('0');
  await fireEvent(input, 'focus');
  await fireEvent.changeText(input, '');
  await fireEvent(input, 'blur');
  expect(input).toHaveDisplayValue('');
});
