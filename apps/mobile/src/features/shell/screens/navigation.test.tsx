import { act } from '@testing-library/react-native';
import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { Alert } from 'react-native';
import TabsLayout from '../../../app/(tabs)/_layout';
import BudgetLayout from '../../../app/(tabs)/budget/_layout';
import Budget from '../../../app/(tabs)/budget/index';
import SelectAccount from '../../../app/(tabs)/budget/select-account';
import WidgetPreview from '../../../app/(tabs)/budget/widget-preview';
import Cards from '../../../app/(tabs)/cards';
import Home from '../../../app/(tabs)/home';
import More from '../../../app/(tabs)/more';
import Index from '../../../app/index';
jest.mock('../../account-selection/api/accounts', () => ({
  loadAccountSelection: jest.fn(() => new Promise(() => {})),
}));
jest.mock('../../budget-shared/api/budgets', () => ({ listBudgets: jest.fn(async () => []) }));

it('opens Budget and navigates all four labelled tabs without creating a budget', async () => {
  const result = await renderRouter(
    {
      index: Index,
      '(tabs)/_layout': TabsLayout,
      '(tabs)/budget/_layout': BudgetLayout,
      '(tabs)/budget/index': Budget,
      '(tabs)/budget/select-account': SelectAccount,
      '(tabs)/budget/widget-preview': WidgetPreview,
      '(tabs)/home': Home,
      '(tabs)/cards': Cards,
      '(tabs)/more': More,
    },
    { initialUrl: '/' },
  );
  expect(await screen.findByText('Your money, organised')).toBeVisible();
  expect(screen.getByRole('tab', { name: 'Budget' })).toBeSelected();
  const create = screen.getByRole('button', { name: 'Create budget' });
  expect(create).toBeEnabled();
  await fireEvent.press(create);
  expect(await screen.findByText('Select an account')).toBeVisible();
  expect(result.getPathname()).toBe('/budget/select-account');
  expect(screen.getByRole('tab', { name: 'Budget' })).toBeSelected();
  await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
  expect(result.getPathname()).toBe('/budget');
  for (const name of ['Home', 'Cards', 'More']) {
    await fireEvent.press(screen.getByRole('tab', { name }));
    expect(await screen.findByRole('header', { name })).toBeVisible();
    expect(screen.getByRole('tab', { name })).toBeSelected();
    expect(screen.getByText('This section is not available in this prototype.')).toBeVisible();
  }
  await fireEvent.press(screen.getByRole('tab', { name: 'Budget' }));
  expect(await screen.findByText('Your money, organised')).toBeVisible();
});

it('opens the offline sample editor and confirms discarding edits before returning to Budget', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const result = await renderRouter(
    {
      index: Index,
      '(tabs)/_layout': TabsLayout,
      '(tabs)/budget/_layout': BudgetLayout,
      '(tabs)/budget/index': Budget,
      '(tabs)/budget/widget-preview': WidgetPreview,
      '(tabs)/budget/select-account': SelectAccount,
      '(tabs)/home': Home,
      '(tabs)/cards': Cards,
      '(tabs)/more': More,
    },
    { initialUrl: '/' },
  );
  await fireEvent.press(await screen.findByRole('button', { name: 'Preview sample widgets' }));
  expect(await screen.findByText('Sample widget editor')).toBeVisible();
  expect(screen.getByText(/They are not based on your account/)).toBeVisible();
  await fireEvent.changeText(screen.getByLabelText('Budget name'), 'Changed sample');
  await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
  expect(alert).toHaveBeenCalledWith(
    'Discard sample edits?',
    expect.any(String),
    expect.any(Array),
  );
  expect(result.getPathname()).toBe('/budget/widget-preview');
  const buttons = alert.mock.calls[0]![2]!;
  await act(() => buttons.find((button) => button.text === 'Discard edits')!.onPress!());
  expect(result.getPathname()).toBe('/budget');
  alert.mockRestore();
});
