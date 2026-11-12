import { fireEvent, render, screen } from '@testing-library/react-native';
import { manualPlan } from '../../budget-creation/api';
import { BudgetEditor } from './BudgetEditor';

async function amount(name: string, value: string, row = 1) {
  const input = screen.getByLabelText(`${name} row ${row} amount in DKK`);
  await fireEvent.changeText(input, value);
  await fireEvent(input, 'blur');
}
async function bills() {
  await fireEvent.press(screen.getByRole('button', { name: 'Add bills to Fixed expenses' }));
}
async function done() {
  const next = screen.queryByRole('button', { name: 'Next' });
  if (next) await fireEvent.press(next);
  const ok = screen.queryByRole('button', { name: 'OK' });
  if (ok) await fireEvent.press(ok);
  await fireEvent.press(screen.getByRole('button', { name: 'Done' }));
}
function remaining(value: string) {
  expect(screen.getAllByText(`DKK ${value} left to allocate`).length).toBeGreaterThan(0);
}

it('US-04: guides 17000 → 9000 → 7000 → 0 without filling amounts, including inside the bill overlay', async () => {
  await render(<BudgetEditor initialPlan={manualPlan()} startBlank onSubmit={jest.fn()} />);
  expect(screen.getAllByText('Not entered yet')).toHaveLength(2);
  const income = screen.getByLabelText('Monthly salary row 1 amount in DKK');
  await fireEvent.changeText(income, '17000');
  expect(screen.queryByText(/17,000 left to allocate$/)).toBeNull();
  await fireEvent(income, 'blur');
  remaining('17,000');
  expect(screen.getAllByText(/Based on amounts entered so far/).length).toBeGreaterThan(0);
  expect(screen.getByRole('button', { name: 'Create budget' })).toBeDisabled();
  await amount('Spending budget', '8000');
  remaining('9,000');
  expect(screen.getByLabelText('Savings row 1 amount in DKK')).toHaveDisplayValue('');
  await amount('Savings', '2000');
  remaining('7,000');
  await bills();
  remaining('7,000');
  await fireEvent.press(screen.getByRole('button', { name: 'Add bill to Fixed expenses' }));
  await amount('Fixed expenses', '7000');
  await fireEvent.changeText(screen.getByLabelText('Fixed expenses row 1 label'), 'Rent');
  remaining('0');
  await done();
  expect(screen.queryByText(/Based on amounts entered so far/)).toBeNull();
  expect(screen.getByRole('button', { name: 'Create budget' })).toBeDisabled();
  await fireEvent.changeText(screen.getByLabelText('Budget name'), 'My plan');
  expect(screen.getByRole('button', { name: 'Create budget' })).toBeEnabled();
});

it('US-10: clearing restores partial guidance; invalid edits retain it; zero is entered', async () => {
  await render(<BudgetEditor initialPlan={manualPlan()} startBlank />);
  await amount('Monthly salary', '17000');
  await amount('Spending budget', '8000');
  await amount('Spending budget', '');
  remaining('17,000');
  expect(screen.getAllByText('Not entered yet')).toHaveLength(2);
  await amount('Spending budget', '-10');
  remaining('17,000');
  expect(screen.getByLabelText('Spending budget row 1 amount in DKK')).toHaveDisplayValue('');
  await amount('Spending budget', '0');
  remaining('17,000');
  expect(screen.getAllByText('Not entered yet')).toHaveLength(1);
  await amount('Monthly salary', '');
  expect(screen.queryByText(/left to allocate$/)).toBeNull();
});

it('US-04: adding and removing bills updates progress without redistributing savings', async () => {
  await render(<BudgetEditor initialPlan={manualPlan()} startBlank />);
  await amount('Savings', '2000');
  await amount('Spending budget', '8000');
  await amount('Monthly salary', '17000');
  await bills();
  await fireEvent.press(screen.getByRole('button', { name: 'Add bill to Fixed expenses' }));
  await amount('Fixed expenses', '7000');
  await fireEvent.press(screen.getByRole('button', { name: 'Add bill to Fixed expenses' }));
  remaining('0');
  expect(screen.getByLabelText('Fixed expenses row 2 amount in DKK')).toHaveDisplayValue('');
  await amount('Fixed expenses', '500', 2);
  expect(screen.getByText('Over-allocated by DKK 500')).toBeVisible();
  await fireEvent.press(screen.getByRole('button', { name: 'Remove Fixed expenses row 2' }));
  remaining('0');
  await done();
  await amount('Monthly salary', '12000');
  expect(screen.getAllByText('Over-allocated by DKK 5,000')).toHaveLength(5);
  expect(screen.getByLabelText('Savings row 1 amount in DKK')).toHaveDisplayValue('2000');
  expect(screen.getByLabelText('Spending budget row 1 amount in DKK')).toHaveDisplayValue('8000');
  expect(screen.queryByRole('button', { name: 'Use remaining' })).toBeNull();
});
