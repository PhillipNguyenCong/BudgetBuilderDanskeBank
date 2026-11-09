import { fireEvent, render, screen } from '@testing-library/react-native';
import { BudgetEditor } from './BudgetEditor';
import { manualPlan } from '../editor/manualPlan';

const press = (name: string) => fireEvent.press(screen.getByRole('button', { name }));
const amount = (value: string, row = 1) =>
  fireEvent.changeText(screen.getByLabelText(`Fixed expenses row ${row} amount in DKK`), value);

it('US-04: switches Add bills to a total, preserves incomplete input, and restores entry after clearing or removing bills', async () => {
  await render(<BudgetEditor initialPlan={manualPlan()} startBlank />);
  expect(screen.getByRole('button', { name: 'Settings for Fixed expenses' })).toBeVisible();
  await press('Add bills to Fixed expenses');
  expect(screen.getByText('No amounts entered')).toBeVisible();
  expect(screen.getByRole('header', { name: 'Bills' })).toBeVisible();
  await amount('0');
  await press('Done');
  expect(screen.queryByRole('button', { name: 'Add bills to Fixed expenses' })).toBeNull();
  expect(screen.getByText('DKK 0')).toBeVisible();
  await press('Edit bills to Fixed expenses');
  await amount('1000');
  await press('Add bill to Fixed expenses');
  await press('Done');
  expect(screen.getByText('Amount incomplete')).toBeVisible();
  await press('Edit bills to Fixed expenses');
  await amount('500', 2);
  await press('Done');
  expect(screen.getByText('DKK 1,500')).toBeVisible();
  await press('Edit bills to Fixed expenses');
  await amount('-1', 2);
  await press('Done');
  expect(screen.getByText('Amount incomplete')).toBeVisible();
  expect(screen.getAllByText('Check amounts')).toHaveLength(4);
  await press('Edit bills to Fixed expenses');
  expect(screen.getByLabelText('Fixed expenses row 2 amount in DKK')).toHaveDisplayValue('-1');
  await amount('');
  await amount('', 2);
  await press('Done');
  expect(screen.getByRole('button', { name: 'Add bills to Fixed expenses' })).toBeVisible();
  await press('Settings for Fixed expenses');
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
  plan.income.rows[0]!.amountOere = 100000;
  await render(<BudgetEditor initialPlan={plan} onSubmit={submit} />);
  await press('Edit bills to Fixed expenses');
  await amount('3600');
  await press('Fixed expenses row 1 frequency: Monthly');
  expect(screen.getByRole('radio', { name: 'Fixed expenses row 1: Monthly' })).toBeChecked();
  await fireEvent.press(screen.getByRole('radio', { name: 'Fixed expenses row 1: Yearly' }));
  expect(screen.queryByRole('radio', { name: 'Fixed expenses row 1: Yearly' })).toBeNull();
  expect(screen.getByLabelText('Fixed expenses row 1 amount in DKK')).toHaveDisplayValue('3600');
  expect(screen.getByText('DKK 300/month')).toBeVisible();
  expect(screen.getByText('DKK 700 left to allocate')).toBeVisible();
  expect(screen.getByText('Set aside per month')).toBeVisible();
  await press('Done');
  expect(screen.getByText('DKK 300')).toBeVisible();
  await press('Create budget');
  expect(submit.mock.calls[0][0].pots[1].rows[0]).toEqual(
    expect.objectContaining({ amountOere: 360000, frequency: 'YEARLY' }),
  );
  await press('Edit bills to Fixed expenses');
  expect(
    screen.getByRole('button', { name: 'Fixed expenses row 1 frequency: Yearly' }),
  ).toBeVisible();
  await amount('');
  expect(screen.queryByText('DKK 300/month')).toBeNull();
  await amount('-1');
  expect(screen.getByText('Check amount')).toBeVisible();
});
