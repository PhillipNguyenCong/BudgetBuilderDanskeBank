import { BackHandler } from 'react-native';
import { calculatePlan } from '@budget-builder/budget-core/allocations';
import { BudgetSchema, createBudgetExample, type BudgetPlan } from '@budget-builder/contracts';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { ApiError } from '../../../lib/api';
import type { BudgetSetup } from '../api/setup';
import { CreateBudgetScreen } from './CreateBudgetScreen';
import { billSuggestions } from '../../../tests/billSuggestionFixtures';

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
async function enterPlan(review = true) {
  await screen.findByLabelText('Budget name');
  await fireEvent.changeText(screen.getByLabelText('Budget name'), 'My manual budget');
  for (const [name, amount] of [
    ['Income', '24000'],
    ['Groceries', '0'],
    ['Fun budget', '8000'],
    ['Fixed expenses', '12000'],
    ['Savings', '4000'],
  ]) {
    if (name === 'Fixed expenses') {
      await fireEvent.press(screen.getByRole('button', { name: 'Add bills to Fixed expenses' }));
      await fireEvent.press(screen.getByRole('button', { name: 'Add bill to Fixed expenses' }));
    }
    const field = screen.getByLabelText(`${name} row 1 amount in DKK`);
    expect(field).toHaveDisplayValue('');
    await fireEvent.changeText(field, amount);
    if (name === 'Fixed expenses') {
      await fireEvent.changeText(screen.getByLabelText('Fixed expenses row 1 label'), 'Rent');
      await fireEvent.press(screen.getByRole('button', { name: 'Close' }));
    }
  }
  if (review) await fireEvent.press(screen.getByRole('button', { name: 'Next' }));
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

it('US-04: account setup does not fetch bills until Add bills is opened', async () => {
  const api = {
    ...services(),
    suggest: jest.fn(async (_id: string, _signal?: AbortSignal) => billSuggestions()),
  };
  await render(<CreateBudgetScreen {...props(api)} />);
  await screen.findByLabelText('Budget name');
  expect(api.suggest).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Add bills to Fixed expenses' }));
  expect(api.suggest).toHaveBeenCalledWith('demo-account', expect.any(AbortSignal));
  expect(screen.getByLabelText('Fixed expenses row 1 label')).toHaveDisplayValue('Rent');
  expect(api.create).not.toHaveBeenCalled();
});

it('US-03: starts blank, submits the accepted manual plan once and preserves input after a failed save', async () => {
  const api = services();
  api.create.mockRejectedValueOnce(new ApiError('VALIDATION_ERROR', 'Review the inputs.', 400));
  const callbacks = props(api);
  await render(<CreateBudgetScreen {...callbacks} />);
  await enterPlan();
  expect(api.create).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Create budget' }));
  expect(await screen.findByText('Review the inputs.')).toBeVisible();
  await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
  expect(screen.getByLabelText('Income row 1 amount in DKK')).toHaveDisplayValue('24.000');
  await fireEvent.press(screen.getByRole('button', { name: 'Next' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Create budget' }));
  expect(callbacks.onCreated).toHaveBeenCalledWith(saved);
  expect(api.create.mock.calls[0]).toEqual([
    'demo-account',
    expect.objectContaining({ name: 'My manual budget' }),
    expect.any(AbortSignal),
  ]);
});

it('US-11: saves the selected month-end rule with the explicit budget creation', async () => {
  const api = services();
  await render(<CreateBudgetScreen {...props(api)} />);
  await enterPlan();
  expect(screen.getByRole('header', { name: 'Rollover' })).toBeVisible();
  await fireEvent.press(
    screen.getByRole('radio', { name: 'Fun budget: Add to next month’s Budget' }),
  );
  expect(api.create).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Create budget' }));
  expect(
    api.create.mock.calls[0]?.[1]?.pots.find((p) => p.type === 'SPENDING' && p.purpose === 'FUN'),
  ).toEqual(
    expect.objectContaining({
      rollover: { enabled: true, destination: 'TO_NEXT_MONTH', targetPotId: null },
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
  await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
  expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();
  await fireEvent.press(screen.getByRole('button', { name: 'Next' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Check saved budgets' }));
  expect(await screen.findByRole('button', { name: 'Open saved budget' })).toBeVisible();
  expect(callbacks.onCreated).not.toHaveBeenCalled();
  expect(screen.getByText('My manual budget')).toBeVisible();
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

it('US-04: Read more discloses guidance without changing the draft or hiding errors after dismissal', async () => {
  await render(<CreateBudgetScreen {...props()} />);
  await screen.findByLabelText('Budget name');
  await fireEvent.changeText(screen.getByLabelText('Budget name'), 'Keep my draft');
  await fireEvent.changeText(screen.getByLabelText('Income row 1 amount in DKK'), '90071992547410');
  expect(screen.queryByText(/No bank transfer/)).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Read more' }));
  expect(screen.getByRole('header', { name: 'About your budget' })).toBeVisible();
  expect(screen.getByText(/No bank transfer/)).toBeVisible();
  expect(screen.getByText(/Available source history:/)).toBeVisible();
  expect(screen.queryByLabelText('Budget name')).toBeNull();
  await fireEvent(screen.getByTestId('budget-info-overlay'), 'requestClose');
  expect(screen.getByLabelText('Budget name')).toHaveDisplayValue('Keep my draft');
  expect(screen.getByLabelText('Income row 1 amount in DKK')).toHaveDisplayValue('90071992547410');
  expect(screen.getByText('This amount is too large.')).toBeVisible();
  await fireEvent.press(screen.getByRole('button', { name: 'Read more' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Done' }));
  expect(screen.getByLabelText('Budget name')).toHaveDisplayValue('Keep my draft');
});

it('US-10: failed salary lookup never blocks manual entry or saving', async () => {
  const api = {
    ...services(),
    salary: jest.fn(async () => {
      throw new Error('offline');
    }),
  };
  await render(<CreateBudgetScreen {...props(api)} />);
  await enterPlan();
  await fireEvent.press(screen.getByRole('button', { name: 'Read more' }));
  expect(
    await screen.findByText('Salary could not be loaded. You can enter it manually.'),
  ).toBeVisible();
  await fireEvent.press(screen.getByRole('button', { name: 'Close' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Create budget' }));
  expect(api.create).toHaveBeenCalledTimes(1);
});

it('US-03/04: Next requires a complete zero remainder and does not save', async () => {
  const api = services();
  await render(<CreateBudgetScreen {...props(api)} />);
  await enterPlan(false);
  expect(screen.queryByRole('header', { name: 'Rollover' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Create budget' })).toBeNull();
  expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();
  await fireEvent.changeText(screen.getByLabelText('Income row 1 amount in DKK'), '25000');
  expect(screen.getByText('Allocate the remaining 1.000 kr. to continue.')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  await fireEvent.changeText(screen.getByLabelText('Income row 1 amount in DKK'), '23000');
  expect(screen.getByText(/Over-allocated by/)).toBeVisible();
  expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  await fireEvent.changeText(screen.getByLabelText('Income row 1 amount in DKK'), '');
  expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  await fireEvent.changeText(screen.getByLabelText('Income row 1 amount in DKK'), '24000');
  await fireEvent.press(screen.getByRole('button', { name: 'Next' }));
  expect(api.create).not.toHaveBeenCalled();
  expect(screen.getByRole('header', { name: 'Review budget' })).toBeVisible();
  expect(screen.getByText('Fully allocated')).toBeVisible();
  expect(screen.getByText('Rent')).toBeVisible();
  expect(screen.getByText('Monthly')).toBeVisible();
  expect(screen.queryByLabelText('Income row 1 amount in DKK')).toBeNull();
});

it('US-04/11: review lists irregular bills and Back preserves amounts, frequencies and rules', async () => {
  const api = services();
  const callbacks = props(api);
  await render(<CreateBudgetScreen {...callbacks} />);
  await enterPlan(false);
  await fireEvent.press(screen.getByRole('button', { name: 'Edit bills to Fixed expenses' }));
  await fireEvent.press(
    screen.getByRole('button', { name: 'Fixed expenses row 1 frequency: Monthly' }),
  );
  await fireEvent.press(screen.getByRole('radio', { name: 'Fixed expenses row 1: Quarterly' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Close' }));
  await fireEvent.changeText(screen.getByLabelText('Savings row 1 amount in DKK'), '12000');
  await fireEvent.press(screen.getByRole('button', { name: 'Next' }));
  expect(screen.getByText('Quarterly · 4.000 kr./month')).toBeVisible();
  expect(screen.getAllByText('12.000 kr.')).toHaveLength(2);
  await fireEvent.press(
    screen.getByRole('radio', { name: 'Fun budget: Add to next month’s Budget' }),
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
  expect(callbacks.onBack).not.toHaveBeenCalled();
  expect(screen.getByLabelText('Savings row 1 amount in DKK')).toHaveDisplayValue('12.000');
  await fireEvent.press(screen.getByRole('button', { name: 'Edit bills to Fixed expenses' }));
  expect(screen.getByLabelText('Fixed expenses row 1 label')).toHaveDisplayValue('Rent');
  expect(
    screen.getByRole('button', { name: 'Fixed expenses row 1 frequency: Quarterly' }),
  ).toBeVisible();
  await fireEvent.press(screen.getByRole('button', { name: 'Close' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Next' }));
  expect(
    screen.getByRole('radio', { name: 'Fun budget: Add to next month’s Budget' }),
  ).toBeChecked();
  expect(api.create).not.toHaveBeenCalled();
});

it('US-03: Android Back returns to allocation without discarding the review draft', async () => {
  let handler: (() => boolean | null | undefined) | undefined;
  const subscription = jest
    .spyOn(BackHandler, 'addEventListener')
    .mockImplementation((_event, listener) => {
      handler = () => listener({} as Parameters<typeof listener>[0]);
      return { remove: jest.fn() };
    });
  try {
    const callbacks = props();
    await render(<CreateBudgetScreen {...callbacks} />);
    await enterPlan();
    await act(() => {
      expect(handler?.()).toBe(true);
    });
    expect(screen.getByLabelText('Budget name')).toHaveDisplayValue('My manual budget');
    expect(callbacks.onBack).not.toHaveBeenCalled();
  } finally {
    subscription.mockRestore();
  }
});
