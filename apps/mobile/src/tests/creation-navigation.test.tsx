import type { Budget } from '@budget-builder/contracts';
import { act } from '@testing-library/react-native';
import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { Alert } from 'react-native';
import Tabs from '../app/(tabs)/_layout';
import BudgetLayout from '../app/(tabs)/budget/_layout';
import CreateBudget from '../app/(tabs)/budget/create';
import BudgetHome from '../app/(tabs)/budget/index';
import SelectAccount from '../app/(tabs)/budget/select-account';
import Cards from '../app/(tabs)/cards';
import Home from '../app/(tabs)/home';
import More from '../app/(tabs)/more';
import Root from '../app/index';
import type { AccountSelectionData } from '../features/account-selection/api';
import { createBudget } from '../features/budget-shared';

let mockSaved: Budget[] = [];
const mockSelection: AccountSelectionData = {
  user: { id: 'demo-user', displayName: 'Demo Customer', isDemo: true },
  accounts: {
    items: [
      {
        id: 'owned',
        name: 'Everyday',
        currency: 'DKK',
        maskedIdentifier: '••1234',
        availableBalanceOere: null,
        bookedBalanceOere: null,
        updatedAt: null,
        issues: [],
      },
    ],
    quality: {
      asOf: '2026-09-03T12:00:00Z',
      coverage: { from: '2026-07-01', to: '2026-09-03', completeMonths: 2 },
      duplicatesRemoved: 0,
      issues: [],
    },
  },
  usedAccountIds: [],
};
jest.mock('../features/account-selection/api/accounts', () => ({
  loadAccountSelection: jest.fn(async () => mockSelection),
}));
jest.mock('../features/budget-shared/api/budgets', () => ({
  listBudgets: jest.fn(async () => mockSaved),
  createBudget: jest.fn(async (accountId, plan) => {
    const { calculatePlan } = require('@budget-builder/budget-core/allocations');
    const saved = {
      id: 'new-budget',
      accountId,
      plan,
      revision: 1,
      totals: calculatePlan(plan),
      createdAt: '2026-11-09T12:00:00Z',
      updatedAt: '2026-11-09T12:00:00Z',
    };
    mockSaved = [saved];
    return saved;
  }),
}));

beforeEach(() => {
  mockSaved = [];
  jest.clearAllMocks();
});

it('US-03: cancelling manual setup discards only the local draft and never writes a budget', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  try {
    const router = await renderRouter(
      {
        index: Root,
        '(tabs)/_layout': Tabs,
        '(tabs)/budget/_layout': BudgetLayout,
        '(tabs)/budget/index': BudgetHome,
        '(tabs)/budget/select-account': SelectAccount,
        '(tabs)/budget/create': CreateBudget,
        '(tabs)/home': Home,
        '(tabs)/cards': Cards,
        '(tabs)/more': More,
      },
      { initialUrl: '/budget/create?accountId=owned' },
    );
    await screen.findByLabelText('Budget name');
    await fireEvent.changeText(screen.getByLabelText('Budget name'), 'Unsaved plan');
    await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
    expect(alert).toHaveBeenCalledWith(
      'Discard budget draft?',
      expect.any(String),
      expect.any(Array),
    );
    expect(screen.getByLabelText('Budget name')).toHaveDisplayValue('Unsaved plan');
    const discard = alert.mock.calls[0]![2]!.find((button) => button.text === 'Discard draft')!;
    await act(() => discard.onPress!());
    expect(await screen.findByText('Select an account')).toBeVisible();
    expect(router.getPathname()).toBe('/budget/select-account');
    expect(createBudget).not.toHaveBeenCalled();
  } finally {
    alert.mockRestore();
  }
});

it('US-03: routes account selection through manual creation to the saved plan without a discard prompt', async () => {
  mockSaved = [];
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  try {
    const router = await renderRouter(
      {
        index: Root,
        '(tabs)/_layout': Tabs,
        '(tabs)/budget/_layout': BudgetLayout,
        '(tabs)/budget/index': BudgetHome,
        '(tabs)/budget/select-account': SelectAccount,
        '(tabs)/budget/create': CreateBudget,
        '(tabs)/home': Home,
        '(tabs)/cards': Cards,
        '(tabs)/more': More,
      },
      { initialUrl: '/' },
    );
    await fireEvent.press(await screen.findByRole('button', { name: 'Create budget' }));
    await fireEvent.press(await screen.findByRole('radio', { name: 'Everyday, ••1234' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findByLabelText('Budget name')).toBeVisible();
    await fireEvent.changeText(screen.getByLabelText('Budget name'), 'November plan');
    for (const [name, amount] of [
      ['Monthly salary', '24000'],
      ['Spending budget', '8000'],
      ['Fixed expenses', '12000'],
      ['Savings', '4000'],
    ]) {
      if (name === 'Fixed expenses')
        await fireEvent.press(screen.getByRole('button', { name: 'Add bills to Fixed expenses' }));
      await fireEvent.changeText(screen.getByLabelText(`${name} row 1 amount in DKK`), amount);
      if (name === 'Fixed expenses')
        await fireEvent.press(screen.getByRole('button', { name: 'Done' }));
    }
    await fireEvent.press(screen.getByRole('button', { name: 'Create budget' }));
    expect(await screen.findByText('Saved monthly plan')).toBeVisible();
    expect(router.getPathname()).toBe('/budget');
    expect(screen.getByRole('header', { name: 'November plan' })).toBeVisible();
    expect(screen.getByRole('tab', { name: 'Budget' })).toBeSelected();
    expect(createBudget).toHaveBeenCalledTimes(1);
    expect(alert).not.toHaveBeenCalled();
  } finally {
    alert.mockRestore();
  }
});

jest.mock('../features/budget-creation/api/setup', () => ({
  loadBudgetSetup: jest.fn(async () => ({
    account: mockSelection.accounts.items[0],
    quality: mockSelection.accounts.quality,
  })),
}));
