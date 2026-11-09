import { render, screen, fireEvent } from '@testing-library/react-native';
import { TextField } from './TextField';

it('strengthens underlined fields on focus, forwards callbacks and preserves error feedback on blur', async () => {
  const focus = jest.fn();
  const blur = jest.fn();
  const view = await render(
    <TextField label="Amount" appearance="underline" value="123" onFocus={focus} onBlur={blur} />,
  );
  expect(screen.getByLabelText('Amount')).toHaveStyle({
    borderBottomWidth: 1,
    backgroundColor: 'transparent',
  });
  await fireEvent(screen.getByLabelText('Amount'), 'focus', { nativeEvent: {} });
  expect(screen.getByLabelText('Amount')).toHaveStyle({ borderBottomWidth: 2 });
  expect(focus).toHaveBeenCalledTimes(1);
  await fireEvent(screen.getByLabelText('Amount'), 'blur', { nativeEvent: {} });
  expect(screen.getByLabelText('Amount')).toHaveStyle({ borderBottomWidth: 1 });
  expect(blur).toHaveBeenCalledTimes(1);
  await view.rerender(
    <TextField label="Amount" appearance="underline" value="invalid" error="Check the amount." />,
  );
  expect(screen.getByLabelText('Amount')).toHaveStyle({ borderBottomWidth: 2 });
  expect(screen.getByRole('alert')).toHaveTextContent('Check the amount.');
});
