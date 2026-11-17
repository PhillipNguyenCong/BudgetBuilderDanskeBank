import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Keyboard, Platform, type KeyboardEvent } from 'react-native';
import { KeyboardDoneBar } from './KeyboardDoneBar';
import { TextField } from './TextField';

it('configures native confirmation and blur for editable form fields', async () => {
  await render(<TextField label="Amount" keyboardDone keyboardType="decimal-pad" />);
  const input = screen.getByLabelText('Amount');
  expect(input.props.inputAccessoryViewButtonLabel).toBe('OK');
  expect(input.props.returnKeyType).toBe('done');
  expect(input.props.submitBehavior).toBe('blurAndSubmit');
});

it('shows Android confirmation only with the keyboard and removes its subscriptions', async () => {
  const platform = jest.replaceProperty(Platform, 'OS', 'android');
  const callbacks = new Map<string, () => void>();
  const remove = jest.fn();
  const subscription = jest.spyOn(Keyboard, 'addListener').mockImplementation((event, listener) => {
    callbacks.set(event, () => listener({} as KeyboardEvent));
    return { remove };
  });
  const dismiss = jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => {});
  try {
    const view = await render(<KeyboardDoneBar />);
    expect(screen.queryByRole('button', { name: 'OK' })).toBeNull();
    await act(() => callbacks.get('keyboardDidShow')?.());
    await fireEvent.press(screen.getByRole('button', { name: 'OK' }));
    expect(dismiss).toHaveBeenCalledTimes(1);
    await act(() => callbacks.get('keyboardDidHide')?.());
    expect(screen.queryByRole('button', { name: 'OK' })).toBeNull();
    await view.unmount();
    expect(remove).toHaveBeenCalledTimes(2);
  } finally {
    dismiss.mockRestore();
    subscription.mockRestore();
    platform.restore();
  }
});
