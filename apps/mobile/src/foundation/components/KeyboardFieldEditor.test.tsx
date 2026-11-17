import { useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Keyboard, Platform, type KeyboardEvent } from 'react-native';
import { KeyboardFieldProvider } from './KeyboardFieldEditor';
import { TextField } from './TextField';

function Form({ commit }: { commit: (value: string) => void }) {
  const [amount, setAmount] = useState('10');
  const [name, setName] = useState('Plan');
  return (
    <KeyboardFieldProvider>
      <TextField
        label="Amount"
        value={amount}
        suffix="kr."
        keyboardDone
        keyboardType="decimal-pad"
        onChangeText={(text) => {
          if (text !== 'invalid') setAmount(text);
        }}
        onBlur={() => commit(amount)}
        error={amount === '999' ? 'Amount is too large.' : undefined}
      />
      <TextField label="Name" value={name} keyboardDone onChangeText={setName} />
    </KeyboardFieldProvider>
  );
}

it('shares accepted draft text and commits once on OK, not during focus handoff', async () => {
  const commit = jest.fn();
  const dismiss = jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => {});
  try {
    await render(<Form commit={commit} />);
    const original = screen.getByLabelText('Amount');
    await fireEvent(original, 'focus', { nativeEvent: { text: '10' } });
    await fireEvent(original, 'blur', { nativeEvent: { text: '10' } });
    expect(commit).not.toHaveBeenCalled();
    const editor = screen.getByLabelText('Keyboard input: Amount');
    expect(editor).toHaveDisplayValue('10');
    expect(editor.props.keyboardType).toBe('decimal-pad');
    await fireEvent.changeText(editor, '12,50');
    expect(original).toHaveDisplayValue('12,50');
    await fireEvent.changeText(editor, 'invalid');
    expect(editor).toHaveDisplayValue('12,50');
    await fireEvent.press(screen.getByRole('button', { name: 'OK' }));
    expect(commit).toHaveBeenCalledTimes(1);
    expect(commit).toHaveBeenCalledWith('12,50');
    expect(screen.queryByLabelText('Keyboard input: Amount')).toBeNull();
    expect(dismiss).toHaveBeenCalled();
    await fireEvent(original, 'focus', { nativeEvent: { text: '12,50' } });
    expect(screen.getByLabelText('Keyboard input: Amount')).toHaveDisplayValue('12,50');
  } finally {
    dismiss.mockRestore();
  }
});

it('supports clearing, visible errors and switching fields without losing edits', async () => {
  const commit = jest.fn();
  await render(<Form commit={commit} />);
  const original = screen.getByLabelText('Amount');
  await fireEvent(original, 'focus', { nativeEvent: { text: '10' } });
  await fireEvent(original, 'blur', { nativeEvent: { text: '10' } });
  await fireEvent.changeText(screen.getByLabelText('Keyboard input: Amount'), '999');
  expect(screen.getAllByText('Amount is too large.')).toHaveLength(2);
  await fireEvent.changeText(screen.getByLabelText('Keyboard input: Amount'), '');
  expect(original).toHaveDisplayValue('');
  await fireEvent(screen.getByLabelText('Name'), 'focus', { nativeEvent: { text: 'Plan' } });
  expect(commit).toHaveBeenCalledWith('');
  expect(screen.queryByLabelText('Keyboard input: Amount')).toBeNull();
  await fireEvent.changeText(screen.getByLabelText('Keyboard input: Name'), 'New plan');
  expect(screen.getByLabelText('Name')).toHaveDisplayValue('New plan');
});

it('closes Android editing on keyboard Back and keeps the last accepted value', async () => {
  const platform = jest.replaceProperty(Platform, 'OS', 'android');
  const callbacks = new Map<string, (() => void)[]>();
  const subscription = jest.spyOn(Keyboard, 'addListener').mockImplementation((name, listener) => {
    const callback = () => listener({ endCoordinates: { screenY: 400 } } as KeyboardEvent);
    callbacks.set(name, [...(callbacks.get(name) ?? []), callback]);
    return { remove: jest.fn() };
  });
  try {
    const commit = jest.fn();
    await render(<Form commit={commit} />);
    await fireEvent(screen.getByLabelText('Amount'), 'focus', { nativeEvent: { text: '10' } });
    await fireEvent(screen.getByLabelText('Amount'), 'blur', { nativeEvent: { text: '10' } });
    await fireEvent.changeText(screen.getByLabelText('Keyboard input: Amount'), '20');
    await act(() => {
      callbacks.get('keyboardDidHide')?.forEach((callback) => callback());
    });
    expect(commit).toHaveBeenCalledTimes(1);
    expect(commit).toHaveBeenCalledWith('20');
    expect(screen.queryByLabelText('Keyboard input: Amount')).toBeNull();
    expect(screen.getByLabelText('Amount')).toHaveDisplayValue('20');
  } finally {
    subscription.mockRestore();
    platform.restore();
  }
});
