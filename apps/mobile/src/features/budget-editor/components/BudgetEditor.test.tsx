import { manualPlan } from '../../budget-creation/api';
import { createBudgetExample } from '@budget-builder/contracts';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { BudgetEditor } from './BudgetEditor';

const open = async (name: string) =>
  fireEvent.press(
    screen.getByRole('button', {
      name: `Edit bills to ${name}`,
    }),
  );
const edit = async (label: string, text: string) =>
  fireEvent.changeText(screen.getByLabelText(label), text);

it('US-04: keeps inline inputs without settings or colour controls', async () => {
  await render(<BudgetEditor initialPlan={createBudgetExample.plan} />);
  await edit('Monthly salary row 1 amount in DKK', '25000');
  expect(screen.queryByRole('button', { name: /Settings/ })).toBeNull();
  expect(screen.queryByRole('radio')).toBeNull();
  await open('Fixed expenses');
  expect(screen.queryByRole('radio')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Done' }));
  expect(screen.getByLabelText('Monthly salary row 1 amount in DKK')).toHaveDisplayValue('25000');
});

it('US-04/10: distinguishes blank from zero and preserves invalid and over-allocated drafts', async () => {
  await render(<BudgetEditor initialPlan={createBudgetExample.plan} />);
  await edit('Monthly salary row 1 amount in DKK', '');
  expect(screen.queryByText('Enter a whole-DKK amount.')).toBeNull();
  expect(screen.queryByText('Income: 0 kr.')).toBeNull();
  expect(screen.getByRole('button', { name: 'Review draft' })).toBeDisabled();
  await edit('Monthly salary row 1 amount in DKK', '0');
  expect(
    screen.getByText('Over-allocated by 24.000 kr.. Reduce allocations or adjust income.'),
  ).toBeVisible();
  expect(screen.getByLabelText('Monthly salary row 1 amount in DKK')).toHaveDisplayValue('0');
  await edit('Monthly salary row 1 amount in DKK', '-1');
  expect(screen.getByLabelText('Monthly salary row 1 amount in DKK')).toHaveDisplayValue('0');
  await edit('Monthly salary row 1 amount in DKK', '24000');
  expect(screen.getByRole('button', { name: 'Review draft' })).toBeEnabled();
});

it('US-04: removes add-pot actions and edits bills in an overlay without expanding the main list', async () => {
  const submit = jest.fn();
  await render(<BudgetEditor initialPlan={createBudgetExample.plan} onSubmit={submit} />);
  expect(screen.queryByLabelText('Spending budget name')).toBeNull();
  expect(screen.getByText('Budget')).toBeVisible();
  expect(screen.queryByText('Add a pot')).toBeNull();
  expect(screen.queryByRole('button', { name: /Add .* pot/ })).toBeNull();
  await open('Fixed expenses');
  for (let i = 0; i < 3; i++)
    await fireEvent.press(screen.getByRole('button', { name: 'Add bill to Fixed expenses' }));
  expect(screen.getByLabelText('Fixed expenses row 7 amount in DKK')).toHaveDisplayValue('');
  for (let i = 7; i >= 5; i--)
    await fireEvent.press(screen.getByRole('button', { name: `Remove Fixed expenses row ${i}` }));
  await fireEvent.press(screen.getByRole('button', { name: 'Done' }));
  expect(screen.queryByLabelText('Fixed expenses row 1 amount in DKK')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Create budget' }));
  expect(submit.mock.calls[0][0].pots[0].rows[0].label).toBe(
    createBudgetExample.plan.pots[0]!.rows[0]!.label,
  );
});

it('US-04: reviews savings before applying, and cancellation preserves inputs', async () => {
  await render(<BudgetEditor initialPlan={createBudgetExample.plan} />);
  await edit('Monthly salary row 1 amount in DKK', '25000');
  await fireEvent.press(screen.getByRole('button', { name: 'Monthly plan' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Update savings' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Review Savings / Rainy day' }));
  expect(screen.getByText('4.000 kr. → 5.000 kr.')).toBeVisible();
  await fireEvent.press(screen.getByRole('button', { name: 'Cancel savings update' }));
  expect(screen.getByText('Unallocated: 1.000 kr.')).toBeVisible();
  await fireEvent.press(screen.getByRole('button', { name: 'Update savings' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Review Savings / Rainy day' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Apply savings update' }));
  expect(screen.getByText('Unallocated: 0 kr.')).toBeVisible();
  expect(screen.getByLabelText('Savings row 1 amount in DKK')).toHaveDisplayValue('5.000');
});

it('US-04: retains source evidence and identifies adjusted amounts', async () => {
  const plan = structuredClone(createBudgetExample.plan);
  plan.pots[1]!.rows[2]!.source = {
    kind: 'SUGGESTED',
    explanation: 'Sample: 2.700 kr. quarterly divided by three.',
    recordIds: [],
    period: { from: '2026-07-01', to: '2026-08-31' },
  };
  await render(<BudgetEditor initialPlan={plan} />);
  await open('Fixed expenses');
  await edit('Fixed expenses row 3 amount in DKK', '950');
  await fireEvent.press(screen.getByRole('button', { name: 'Source details' }));
  expect(screen.getByText('Adjusted by you')).toBeVisible();
  expect(screen.getByText('Sample: 2.700 kr. quarterly divided by three.')).toBeVisible();
  expect(screen.getByText('Source period: 2026-07-01 – 2026-08-31')).toBeVisible();
});

it('US-04: platform dismissal retains bill edits', async () => {
  await render(<BudgetEditor initialPlan={createBudgetExample.plan} />);
  await open('Fixed expenses');
  await edit('Fixed expenses row 1 amount in DKK', '8000');
  expect(screen.getByText('11.000 kr.')).toBeVisible();
  await fireEvent(screen.getByTestId('budget-widget-overlay'), 'requestClose');
  expect(screen.getByText('11.000 kr.')).toBeVisible();
  await open('Fixed expenses');
  expect(screen.getByLabelText('Fixed expenses row 1 amount in DKK')).toHaveDisplayValue('8000');
  await fireEvent.press(screen.getByRole('button', { name: 'Done' }));
});

it('US-04/13: parent rerenders preserve the draft; an intentional key change starts a new draft', async () => {
  const onDirty = jest.fn();
  const { rerender } = await render(
    <BudgetEditor key="first" initialPlan={createBudgetExample.plan} onDirty={onDirty} />,
  );
  await edit('Monthly salary row 1 amount in DKK', '25000');
  await fireEvent.press(screen.getByRole('button', { name: 'Review draft' }));
  expect(screen.getByText('Draft valid. This preview does not save a budget.')).toBeVisible();
  await rerender(
    <BudgetEditor
      key="first"
      initialPlan={structuredClone(createBudgetExample.plan)}
      onDirty={onDirty}
    />,
  );
  expect(screen.getByLabelText('Monthly salary row 1 amount in DKK')).toHaveDisplayValue('25000');
  expect(onDirty).toHaveBeenCalledTimes(1);
  await edit('Monthly salary row 1 amount in DKK', '26000');
  expect(screen.queryByText('Draft valid. This preview does not save a budget.')).toBeNull();
  await rerender(<BudgetEditor key="second" initialPlan={createBudgetExample.plan} startBlank />);
  expect(screen.getByLabelText('Monthly salary row 1 amount in DKK')).toHaveDisplayValue('');
  expect(screen.getByRole('button', { name: 'Review draft' })).toBeDisabled();
});

it('accepts decimal amounts in every widget and bill field while rejecting invalid edits', async () => {
  await render(<BudgetEditor initialPlan={createBudgetExample.plan} />);
  for (const name of ['Monthly salary', 'Spending budget', 'Savings', 'Fixed expenses']) {
    if (name === 'Fixed expenses') await open(name);
    const label = `${name} row 1 amount in DKK`;
    expect(screen.getByLabelText(label).props.keyboardType).toBe('decimal-pad');
    await edit(label, '1250,50');
    for (const invalid of ['1250,501', '1,250.50', '1.250,50', '-12', 'abc']) {
      await edit(label, invalid);
      expect(screen.getByLabelText(label)).toHaveDisplayValue('1250,50');
    }
    await edit(label, '1250.5');
    expect(screen.getByLabelText(label)).toHaveDisplayValue('1250.5');
    await edit(label, '1250.');
    expect(screen.getByLabelText(label)).toHaveDisplayValue('1250.');
    await edit(label, '');
    expect(screen.getByLabelText(label)).toHaveDisplayValue('');
    if (name === 'Fixed expenses')
      await fireEvent.press(screen.getByRole('button', { name: 'Done' }));
  }
  expect(screen.getByRole('button', { name: 'Review draft' })).toBeDisabled();
});

it('US-04: prefills salary and committed guidance once, retaining other blank amounts and manual clearing', async () => {
  const initialPlan = manualPlan();
  const suggestion = {
    accountId: 'demo-account',
    snapshotDate: '2026-09-03',
    suggestion: { amountOere: 2500050, paymentDate: '2026-08-31', transactionId: 'salary' },
    explanation: 'Latest salary',
  };
  const view = await render(<BudgetEditor initialPlan={initialPlan} startBlank />);
  await view.rerender(
    <BudgetEditor initialPlan={initialPlan} startBlank salarySuggestion={suggestion} />,
  );
  expect(screen.getByLabelText('Monthly salary row 1 amount in DKK')).toHaveDisplayValue(
    '25.000,50',
  );
  expect(screen.getAllByText('25.000,50 kr. left')).toHaveLength(1);
  expect(screen.queryByText('From latest salary')).toBeNull();
  expect(screen.getByLabelText('Spending budget row 1 amount in DKK')).toHaveDisplayValue('');
  await edit('Monthly salary row 1 amount in DKK', '');
  await view.rerender(
    <BudgetEditor initialPlan={initialPlan} startBlank salarySuggestion={{ ...suggestion }} />,
  );
  expect(screen.getByLabelText('Monthly salary row 1 amount in DKK')).toHaveDisplayValue('');
  expect(screen.queryByText('From latest salary')).toBeNull();
});

it('US-04: a delayed salary suggestion cannot overwrite manual input', async () => {
  const initialPlan = manualPlan();
  const view = await render(<BudgetEditor initialPlan={initialPlan} startBlank />);
  await edit('Monthly salary row 1 amount in DKK', '28000');
  await view.rerender(
    <BudgetEditor
      initialPlan={initialPlan}
      startBlank
      salarySuggestion={{
        accountId: 'demo-account',
        snapshotDate: '2026-09-03',
        suggestion: { amountOere: 2500000, paymentDate: '2026-08-31', transactionId: 'salary' },
        explanation: 'Latest salary',
      }}
    />,
  );
  expect(screen.getByLabelText('Monthly salary row 1 amount in DKK')).toHaveDisplayValue('28000');
});
