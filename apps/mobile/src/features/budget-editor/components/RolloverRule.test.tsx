import { fireEvent, render, screen } from '@testing-library/react-native';
import { manualPlan } from '../../budget-creation/api';
import { BudgetEditor } from './BudgetEditor';

function plan() {
  const value = manualPlan();
  value.name = 'Rollover plan';
  value.income.rows[0]!.amountOere = 100000;
  value.pots.find((p) => p.type === 'SPENDING')!.rows[0]!.amountOere = 20000;
  value.pots.find((p) => p.type === 'SAVINGS')!.rows[0]!.amountOere = 10000;
  return value;
}
const select = (label: string, name = 'Spending budget') =>
  fireEvent.press(screen.getByRole('radio', { name: `${name}: ${label}` }));

it('stores next-month and off preferences only on explicit creation, without changing allocations', async () => {
  const submit = jest.fn();
  await render(<BudgetEditor initialPlan={plan()} onSubmit={submit} />);
  expect(screen.getByRole('radio', { name: 'Spending budget: Keep unallocated' })).toBeChecked();
  expect(
    screen.getByText('Saved preference only. Automatic month-end processing is not available yet.'),
  ).toBeVisible();
  await select('Add to next month’s Budget');
  expect(submit).not.toHaveBeenCalled();
  expect(screen.getByLabelText('Savings row 1 amount in DKK')).toHaveDisplayValue('100');
  expect(screen.getByLabelText('Spending budget row 1 amount in DKK')).toHaveDisplayValue('200');
  await fireEvent.press(screen.getByRole('button', { name: 'Create budget' }));
  expect(
    submit.mock.calls[0][0].pots.find((p: { type: string }) => p.type === 'SPENDING').rollover,
  ).toEqual({ enabled: true, destination: 'TO_NEXT_MONTH', targetPotId: null });
  await select('Keep unallocated');
  await fireEvent.press(screen.getByRole('button', { name: 'Create budget' }));
  expect(
    submit.mock.calls[1][0].pots.find((p: { type: string }) => p.type === 'SPENDING').rollover,
  ).toEqual({ enabled: false, destination: null, targetPotId: null });
});

it('selects the sole savings target after choosing savings, and clears it for carry-forward', async () => {
  const submit = jest.fn();
  await render(<BudgetEditor initialPlan={plan()} onSubmit={submit} />);
  await select('Add to savings');
  expect(screen.getByText('Savings destination: Savings')).toBeVisible();
  await fireEvent.press(screen.getByRole('button', { name: 'Create budget' }));
  expect(
    submit.mock.calls[0][0].pots.find((p: { type: string }) => p.type === 'SPENDING').rollover,
  ).toEqual({ enabled: true, destination: 'TO_SAVINGS', targetPotId: 'savings' });
  expect(
    submit.mock.calls[0][0].pots.find((p: { type: string }) => p.type === 'SAVINGS').rows[0]
      .amountOere,
  ).toBe(10000);
  await select('Add to next month’s Budget');
  await fireEvent.press(screen.getByRole('button', { name: 'Create budget' }));
  expect(
    submit.mock.calls[1][0].pots.find((p: { type: string }) => p.type === 'SPENDING').rollover
      .targetPotId,
  ).toBeNull();
});

it('requires an explicit target when multiple savings pots exist', async () => {
  const value = plan();
  value.pots.push({
    id: 'other-savings',
    name: 'Holiday',
    type: 'SAVINGS',
    color: 'MINT',
    rows: [{ id: 'holiday-row', label: 'Holiday', amountOere: 0 }],
  });
  await render(<BudgetEditor initialPlan={value} onSubmit={jest.fn()} />);
  await select('Add to savings');
  expect(screen.getByText('Select a savings pot in this budget.')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Create budget' })).toBeDisabled();
  await fireEvent.press(
    screen.getByRole('radio', { name: 'Spending budget savings target Holiday' }),
  );
  expect(screen.getByRole('button', { name: 'Create budget' })).toBeEnabled();
});

it('keeps stored spending rules independent and preserves inputs on rerender', async () => {
  const value = plan();
  value.pots.push({
    id: 'other-budget',
    name: 'Travel',
    type: 'SPENDING',
    color: 'SKY',
    rows: [{ id: 'travel-row', label: 'Travel', amountOere: 0 }],
    rollover: { enabled: true, destination: 'TO_NEXT_MONTH', targetPotId: null },
  });
  const view = await render(<BudgetEditor initialPlan={value} />);
  await select('Add to savings');
  await view.rerender(<BudgetEditor initialPlan={structuredClone(value)} />);
  expect(screen.getByRole('radio', { name: 'Spending budget: Add to savings' })).toBeChecked();
  expect(screen.getByRole('radio', { name: 'Travel: Add to next month’s Budget' })).toBeChecked();
});

it('disables unavailable savings and never fixes an overspent draft by selecting a rule', async () => {
  const value = plan();
  value.pots = value.pots.filter((p) => p.type !== 'SAVINGS');
  value.income.rows[0]!.amountOere = 10000;
  await render(<BudgetEditor initialPlan={value} onSubmit={jest.fn()} />);
  expect(screen.getByRole('radio', { name: 'Spending budget: Add to savings' })).toBeDisabled();
  await select('Add to next month’s Budget');
  expect(screen.getByText(/Over-allocated by/)).toBeVisible();
  expect(screen.getByRole('button', { name: 'Create budget' })).toBeDisabled();
});
