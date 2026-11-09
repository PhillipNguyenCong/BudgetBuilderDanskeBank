import { render, screen, fireEvent } from '@testing-library/react-native';
import { createBudgetExample } from '@budget-builder/contracts';
import { BudgetEditor } from './BudgetEditor';

const open = async (name: string) =>
  fireEvent.press(
    screen.getByRole('button', {
      name: `${name === 'Fixed expenses' ? 'Edit bills' : 'Settings'} for ${name}`,
    }),
  );
const edit = async (label: string, text: string) =>
  fireEvent.changeText(screen.getByLabelText(label), text);

it('US-04: edits inline and retains values when closing a colour-only income overlay', async () => {
  await render(<BudgetEditor initialPlan={createBudgetExample.plan} />);
  await edit('Monthly salary row 1 amount in DKK', '25000');
  expect(screen.getByText('Unallocated: DKK 1,000')).toBeVisible();
  await open('Monthly salary');
  expect(screen.queryByLabelText('Monthly salary row 1 amount in DKK')).toBeNull();
  expect(screen.queryByRole('switch')).toBeNull();
  expect(screen.getAllByRole('radio')).toHaveLength(6);
  await fireEvent.press(screen.getByRole('radio', { name: 'Monthly salary color Rose' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Done' }));
  expect(screen.getByLabelText('Monthly salary row 1 amount in DKK')).toHaveDisplayValue('25000');
  expect(screen.getByLabelText('Savings row 1 amount in DKK')).toHaveDisplayValue('4000');
  await open('Monthly salary');
  expect(screen.getByRole('radio', { name: 'Monthly salary color Rose' })).toBeChecked();
  await fireEvent.press(screen.getByRole('button', { name: 'Close' }));
  expect(screen.getByRole('button', { name: 'Settings for Monthly salary' })).toBeVisible();
});

it('US-04/10: distinguishes blank from zero and preserves invalid and over-allocated drafts', async () => {
  await render(<BudgetEditor initialPlan={createBudgetExample.plan} />);
  await edit('Monthly salary row 1 amount in DKK', '');
  expect(screen.getByText('Enter a whole-DKK amount.')).toBeVisible();
  expect(screen.queryByText('Income: DKK 0')).toBeNull();
  expect(screen.getByRole('button', { name: 'Review draft' })).toBeDisabled();
  await edit('Monthly salary row 1 amount in DKK', '0');
  expect(
    screen.getByText('Over-allocated by DKK 24,000. Reduce allocations or adjust income.'),
  ).toBeVisible();
  expect(screen.getByLabelText('Monthly salary row 1 amount in DKK')).toHaveDisplayValue('0');
  await edit('Monthly salary row 1 amount in DKK', '-1');
  expect(screen.getByText('Use a non-negative whole-DKK amount.')).toBeVisible();
  await edit('Monthly salary row 1 amount in DKK', '24000');
  expect(screen.getByRole('button', { name: 'Review draft' })).toBeEnabled();
});

it('US-04: adds compact pots and edits bills in an overlay without expanding the main list', async () => {
  const submit = jest.fn();
  await render(<BudgetEditor initialPlan={createBudgetExample.plan} onSubmit={submit} />);
  await edit('Spending budget name', 'Everyday');
  await fireEvent.press(screen.getByRole('button', { name: 'Add Savings pot' }));
  expect(screen.getByLabelText('New savings row 1 amount in DKK')).toHaveDisplayValue('');
  await edit('New savings row 1 amount in DKK', '0');
  await open('Fixed expenses');
  for (let i = 0; i < 3; i++)
    await fireEvent.press(screen.getByRole('button', { name: 'Add bill to Fixed expenses' }));
  expect(screen.getByLabelText('Fixed expenses row 7 amount in DKK')).toHaveDisplayValue('');
  for (let i = 7; i >= 5; i--)
    await fireEvent.press(screen.getByRole('button', { name: `Remove Fixed expenses row ${i}` }));
  await fireEvent.press(screen.getByRole('button', { name: 'Done' }));
  expect(screen.queryByLabelText('Fixed expenses row 1 amount in DKK')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Create budget' }));
  expect(submit.mock.calls[0][0].pots[0].rows[0].label).toBe('Everyday');
});

it('US-04: reviews savings before applying, and cancellation preserves inputs', async () => {
  await render(<BudgetEditor initialPlan={createBudgetExample.plan} />);
  await edit('Monthly salary row 1 amount in DKK', '25000');
  await fireEvent.press(screen.getByRole('button', { name: 'Update savings' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Review Savings / Rainy day' }));
  expect(screen.getByText('DKK 4,000 → DKK 5,000')).toBeVisible();
  await fireEvent.press(screen.getByRole('button', { name: 'Cancel savings update' }));
  expect(screen.getByText('Unallocated: DKK 1,000')).toBeVisible();
  await fireEvent.press(screen.getByRole('button', { name: 'Update savings' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Review Savings / Rainy day' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Apply savings update' }));
  expect(screen.getByText('Unallocated: DKK 0')).toBeVisible();
  expect(screen.getByLabelText('Savings row 1 amount in DKK')).toHaveDisplayValue('5000');
});

it('US-04: retains source evidence and identifies adjusted amounts', async () => {
  const plan = structuredClone(createBudgetExample.plan);
  plan.pots[1]!.rows[2]!.source = {
    kind: 'SUGGESTED',
    explanation: 'Sample: DKK 2,700 quarterly divided by three.',
    recordIds: [],
    period: { from: '2026-07-01', to: '2026-08-31' },
  };
  await render(<BudgetEditor initialPlan={plan} />);
  await open('Fixed expenses');
  await edit('Fixed expenses row 3 amount in DKK', '950');
  expect(screen.getByText('Adjusted by you')).toBeVisible();
  expect(screen.getByText('Sample: DKK 2,700 quarterly divided by three.')).toBeVisible();
  expect(screen.getByText('Source period: 2026-07-01 – 2026-08-31')).toBeVisible();
});

it('US-04: platform dismissal retains bill edits and savings settings contain only colours', async () => {
  await render(<BudgetEditor initialPlan={createBudgetExample.plan} />);
  await open('Fixed expenses');
  await edit('Fixed expenses row 1 amount in DKK', '8000');
  expect(screen.getByText('DKK 11,000')).toBeVisible();
  await fireEvent(screen.getByTestId('budget-widget-overlay'), 'requestClose');
  expect(screen.getByText('DKK 11,000')).toBeVisible();
  await open('Fixed expenses');
  expect(screen.getByLabelText('Fixed expenses row 1 amount in DKK')).toHaveDisplayValue('8000');
  await fireEvent.press(screen.getByRole('button', { name: 'Done' }));
  await open('Savings');
  expect(screen.getAllByRole('radio')).toHaveLength(6);
  expect(screen.queryByRole('switch')).toBeNull();
  expect(screen.queryByRole('textbox')).toBeNull();
  expect(screen.queryByRole('button', { name: /Add bill/ })).toBeNull();
});
