import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Keyboard, type KeyboardEvent } from 'react-native';
import { createBudgetExample } from '@budget-builder/contracts';
import { BudgetEditor } from './BudgetEditor';

const press = (name: string) => fireEvent.press(screen.getByRole('button', { name }));
const field = (row: number, kind = 'label') =>
  screen.getByLabelText(`Fixed expenses row ${row} ${kind}`);
async function open() {
  await render(<BudgetEditor initialPlan={createBudgetExample.plan} />);
  await press('Edit bills for Fixed expenses');
}

it('adds bills with name → amount → OK without closing, and keeps focus through edits', async () => {
  await open();
  await press('Add bill to Fixed expenses');
  expect(screen.getByRole('button', { name: 'Next' })).toBeVisible();
  expect(screen.queryByRole('button', { name: 'Done' })).toBeNull();
  await fireEvent.changeText(field(5), 'Insurance');
  expect(screen.getByRole('button', { name: 'Next' })).toBeVisible();
  await press('Next');
  expect(screen.getByRole('button', { name: 'OK' })).toBeVisible();
  await fireEvent.changeText(field(5, 'amount in DKK'), '125,50');
  await press('OK');
  expect(screen.getByRole('header', { name: 'Bills' })).toBeVisible();
  expect(field(5, 'amount in DKK')).toHaveDisplayValue('125,50');
  await press('Add bill to Fixed expenses');
  expect(screen.getByRole('button', { name: 'Next' })).toBeVisible();
  await fireEvent(field(6), 'submitEditing');
  expect(screen.getByRole('button', { name: 'OK' })).toBeVisible();
  await fireEvent(field(6, 'amount in DKK'), 'submitEditing');
  expect(screen.getByRole('button', { name: 'Done' })).toBeVisible();
  await press('Done');
  expect(screen.queryByRole('header', { name: 'Bills' })).toBeNull();
});

it('edits existing rows, removes active rows and waits for keyboard dismissal before Done', async () => {
  const listeners = new Map<string, () => void>();
  const subscription = jest.spyOn(Keyboard, 'addListener').mockImplementation((event, listener) => {
    listeners.set(event, () => listener({} as KeyboardEvent));
    return { remove: jest.fn() };
  });
  try {
    await open();
    await fireEvent(field(2), 'focus', { nativeEvent: {} });
    await act(() => listeners.get('keyboardDidShow')?.());
    expect(screen.getByRole('button', { name: 'Next' })).toBeVisible();
    await press('Next');
    await press('OK');
    expect(screen.queryByRole('button', { name: 'Done' })).toBeNull();
    await act(() => listeners.get('keyboardDidHide')?.());
    expect(screen.getByRole('button', { name: 'Done' })).toBeVisible();
    await fireEvent(field(1, 'amount in DKK'), 'focus', { nativeEvent: {} });
    expect(screen.getByRole('button', { name: 'OK' })).toBeVisible();
    await press('Remove Fixed expenses row 1');
    expect(screen.getByRole('button', { name: 'Done' })).toBeVisible();
    await press('Add bill to Fixed expenses');
    await act(() => listeners.get('keyboardDidHide')?.());
    expect(screen.getByRole('button', { name: 'Done' })).toBeVisible();
    await press('Close');
    expect(screen.queryByRole('header', { name: 'Bills' })).toBeNull();
  } finally {
    subscription.mockRestore();
  }
});
