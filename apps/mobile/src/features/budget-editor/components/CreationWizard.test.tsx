import { createBudgetExample } from '@budget-builder/contracts';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { BudgetEditor } from './BudgetEditor';

it('keeps an unfinished review target editable without trapping allocation validation', async () => {
  const plan = structuredClone(createBudgetExample.plan);
  plan.pots.push({
    id: 'holiday',
    name: 'Holiday',
    color: 'MINT',
    type: 'SAVINGS',
    rows: [{ id: 'holiday-row', label: 'Holiday', amountOere: 0 }],
  });
  const save = jest.fn();
  const next = jest.fn();
  const view = await render(
    <BudgetEditor initialPlan={plan} creationStep="review" onSubmit={save} onNext={next} />,
  );
  await fireEvent.press(screen.getByRole('radio', { name: 'Spending budget: Add to savings' }));
  expect(screen.getByText('Select a savings pot in this budget.')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Create budget' })).toBeDisabled();
  await view.rerender(
    <BudgetEditor initialPlan={plan} creationStep="allocate" onSubmit={save} onNext={next} />,
  );
  expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();
  await fireEvent.press(screen.getByRole('button', { name: 'Next' }));
  expect(next).toHaveBeenCalledTimes(1);
  expect(save).not.toHaveBeenCalled();
  await view.rerender(
    <BudgetEditor initialPlan={plan} creationStep="review" onSubmit={save} onNext={next} />,
  );
  expect(screen.getByRole('radio', { name: 'Spending budget: Add to savings' })).toBeChecked();
  await fireEvent.press(
    screen.getByRole('radio', { name: 'Spending budget savings target Holiday' }),
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Create budget' }));
  expect(
    save.mock.calls[0][0].pots.find((p: { type: string }) => p.type === 'SPENDING').rollover
      .targetPotId,
  ).toBe('holiday');
});

it('allows explicit zero income and allocations to proceed', async () => {
  const plan = structuredClone(createBudgetExample.plan);
  plan.income.rows.forEach((row) => {
    row.amountOere = 0;
  });
  plan.pots.forEach((pot) =>
    pot.rows.forEach((row) => {
      row.amountOere = 0;
    }),
  );
  await render(<BudgetEditor initialPlan={plan} creationStep="allocate" onNext={jest.fn()} />);
  expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();
});

it('lists every bill in the read-only review without exposing editable fields', async () => {
  const plan = structuredClone(createBudgetExample.plan);
  await render(<BudgetEditor initialPlan={plan} creationStep="review" onSubmit={jest.fn()} />);
  const bills = plan.pots.filter((pot) => pot.type === 'FIXED_EXPENSE').flatMap((pot) => pot.rows);
  for (const bill of bills) expect(screen.getByText(bill.label)).toBeVisible();
  expect(screen.queryByRole('textbox')).toBeNull();
  expect(screen.queryByLabelText('Budget name')).toBeNull();
  expect(screen.getByRole('button', { name: 'Create budget' })).toBeEnabled();
});
