import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { BudgetSchema, createBudgetExample, type BudgetPlan } from '@budget-builder/contracts';
import { calculatePlan } from '@budget-builder/budget-core/allocations';
import { CreateBudgetScreen } from './CreateBudgetScreen';
import { ApiError } from '../../../lib/api';
import type { BudgetSetup } from '../api/budgets';

const setup: BudgetSetup = {
  account: {
    id: 'demo-account',
    name: 'Everyday',
    currency: 'DKK',
    maskedIdentifier: '••1234',
    availableBalanceOere: null,
    bookedBalanceOere: null,
    updatedAt: null,
    issues: [],
  },
  quality: {
    asOf: '2026-09-03T12:00:00Z',
    coverage: { from: '2026-07-01', to: '2026-09-03', completeMonths: 2 },
    duplicatesRemoved: 0,
    issues: [],
  },
};
const saved = BudgetSchema.parse({
  id: 'saved-budget',
  accountId: 'demo-account',
  revision: 1,
  createdAt: '2026-11-09T12:00:00Z',
  updatedAt: '2026-11-09T12:00:00Z',
  plan: createBudgetExample.plan,
  totals: calculatePlan(createBudgetExample.plan),
});
function services() {
  return {
    load: jest.fn(async (_id: string, _signal?: AbortSignal) => setup),
    create: jest.fn(async (_id: string, _plan: BudgetPlan, _signal?: AbortSignal) => saved),
    list: jest.fn(async (_signal?: AbortSignal) => [saved]),
  };
}
async function enterPlan() {
  await screen.findByLabelText('Budget name');
  await fireEvent.changeText(screen.getByLabelText('Budget name'), 'My manual budget');
  for (const [name, amount] of [
    ['Monthly salary', '24000'],
    ['Spending budget', '8000'],
    ['Fixed expenses', '12000'],
    ['Savings', '4000'],
  ]) {
    if (name === 'Fixed expenses')
      await fireEvent.press(screen.getByRole('button', { name: 'Add bills to Fixed expenses' }));
    const field = screen.getByLabelText(`${name} row 1 amount in DKK`);
    expect(field).toHaveDisplayValue('');
    await fireEvent.changeText(field, amount);
    if (name === 'Fixed expenses')
      await fireEvent.press(screen.getByRole('button', { name: 'Done' }));
  }
}
function props(api = services()) {
  return {
    accountId: 'demo-account',
    onBack: jest.fn(),
    onCreated: jest.fn(),
    onOpenExisting: jest.fn(),
    onDirty: jest.fn(),
    onBusy: jest.fn(),
    services: api,
  };
}

it('US-03: starts blank, submits the accepted manual plan once and preserves input after a failed save', async () => {
  const api = services();
  api.create.mockRejectedValueOnce(new ApiError('VALIDATION_ERROR', 'Review the inputs.', 400));
  const callbacks = props(api);
  await render(<CreateBudgetScreen {...callbacks} />);
  await enterPlan();
  expect(api.create).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Create budget' }));
  expect(await screen.findByText('Review the inputs.')).toBeVisible();
  expect(screen.getByLabelText('Monthly salary row 1 amount in DKK')).toHaveDisplayValue('24000');
  await fireEvent.press(screen.getByRole('button', { name: 'Create budget' }));
  expect(callbacks.onCreated).toHaveBeenCalledWith(saved);
  expect(api.create.mock.calls[0]).toEqual([
    'demo-account',
    expect.objectContaining({ name: 'My manual budget' }),
    expect.any(AbortSignal),
  ]);
});

it('US-11: optional rollover validates a destination and saves the chosen savings target', async () => {
  const api = services();
  await render(<CreateBudgetScreen {...props(api)} />);
  await enterPlan();
  await fireEvent.press(screen.getByRole('button', { name: 'Settings for Spending budget' }));
  await fireEvent(
    screen.getByRole('switch', { name: 'Spending budget automatic rollover' }),
    'valueChange',
    true,
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Done' }));
  expect(screen.getByRole('button', { name: 'Create budget' })).toBeDisabled();
  await fireEvent.press(screen.getByRole('button', { name: 'Settings for Spending budget' }));
  await fireEvent.press(screen.getByRole('radio', { name: 'Spending budget: To savings' }));
  expect(screen.getByText('Select a savings pot, or add one first.')).toBeVisible();
  await fireEvent.press(
    screen.getByRole('radio', { name: 'Spending budget savings target Savings' }),
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Done' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Create budget' }));
  expect(api.create.mock.calls[0]?.[1]).toEqual(
    expect.objectContaining({
      pots: expect.arrayContaining([
        expect.objectContaining({
          type: 'SPENDING',
          rollover: { enabled: true, destination: 'TO_SAVINGS', targetPotId: 'savings' },
        }),
      ]),
    }),
  );
});

it('US-03: a lost save response blocks resubmission and offers the existing budget without replacing the draft', async () => {
  const api = services();
  api.create.mockRejectedValueOnce(
    new ApiError('SAVE_UNCONFIRMED', 'Check saved budgets.', undefined, true),
  );
  const callbacks = props(api);
  await render(<CreateBudgetScreen {...callbacks} />);
  await enterPlan();
  await fireEvent.press(screen.getByRole('button', { name: 'Create budget' }));
  expect(await screen.findByRole('button', { name: 'Check saved budgets' })).toBeEnabled();
  expect(screen.getByRole('button', { name: 'Create budget' })).toBeDisabled();
  await fireEvent.press(screen.getByRole('button', { name: 'Check saved budgets' }));
  expect(await screen.findByRole('button', { name: 'Open saved budget' })).toBeVisible();
  expect(callbacks.onCreated).not.toHaveBeenCalled();
  expect(screen.getByLabelText('Budget name')).toHaveDisplayValue('My manual budget');
  expect(api.create).toHaveBeenCalledTimes(1);
});

it('US-03: locks editing/navigation while a save is pending', async () => {
  const api = services();
  let finish!: (value: typeof saved) => void;
  api.create.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const callbacks = props(api);
  await render(<CreateBudgetScreen {...callbacks} />);
  await enterPlan();
  await fireEvent.press(screen.getByRole('button', { name: 'Create budget' }));
  expect(screen.getByText('Saving budget…')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled();
  expect(screen.queryByLabelText('Budget name')).toBeNull();
  await act(() => finish(saved));
  expect(api.create).toHaveBeenCalledTimes(1);
  expect(callbacks.onCreated).toHaveBeenCalledTimes(1);
});

it('US-03: failed eligibility blocks the editor and back creates nothing', async () => {
  const api = services();
  api.load.mockRejectedValueOnce(new Error('This account already has a budget.'));
  const callbacks = props(api);
  await render(<CreateBudgetScreen {...callbacks} />);
  expect(await screen.findByText('This account already has a budget.')).toBeVisible();
  expect(screen.queryByLabelText('Budget name')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
  expect(api.create).not.toHaveBeenCalled();
  expect(callbacks.onBack).toHaveBeenCalled();
});

it('US-04: More info discloses guidance without changing the draft or hiding errors after dismissal', async () => {
  await render(<CreateBudgetScreen {...props()} />);
  await screen.findByLabelText('Budget name');
  await fireEvent.changeText(screen.getByLabelText('Budget name'), 'Keep my draft');
  await fireEvent.changeText(screen.getByLabelText('Monthly salary row 1 amount in DKK'), '-1');
  expect(screen.queryByText(/No bank transfer/)).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'More info' }));
  expect(screen.getByRole('header', { name: 'About your budget' })).toBeVisible();
  expect(screen.getByText(/No bank transfer/)).toBeVisible();
  expect(screen.getByText(/Available source history:/)).toBeVisible();
  expect(screen.queryByLabelText('Budget name')).toBeNull();
  await fireEvent(screen.getByTestId('budget-info-overlay'), 'requestClose');
  expect(screen.getByLabelText('Budget name')).toHaveDisplayValue('Keep my draft');
  expect(screen.getByLabelText('Monthly salary row 1 amount in DKK')).toHaveDisplayValue('-1');
  expect(screen.getByText('Use a non-negative whole-DKK amount.')).toBeVisible();
  await fireEvent.press(screen.getByRole('button', { name: 'More info' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Done' }));
  expect(screen.getByLabelText('Budget name')).toHaveDisplayValue('Keep my draft');
});
