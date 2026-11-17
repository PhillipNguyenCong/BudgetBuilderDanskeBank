import { fireEvent, render, screen } from '@testing-library/react-native';
import { AppText } from './AppText';
import { ReadMore } from './ReadMore';

it('discloses supporting information and supports Close and platform back', async () => {
  await render(
    <ReadMore title="About guidance">
      <AppText>Calculation details</AppText>
    </ReadMore>,
  );
  expect(screen.queryByText('Calculation details')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Read more' }));
  expect(screen.getByRole('header', { name: 'About guidance' })).toBeVisible();
  expect(screen.getByText('Calculation details')).toBeVisible();
  await fireEvent(screen.getByTestId('read-more-overlay'), 'requestClose');
  expect(screen.queryByText('Calculation details')).toBeNull();
  expect(screen.getByRole('button', { name: 'Read more' }).props.accessibilityState.expanded).toBe(
    false,
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Read more' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Close' }));
  expect(screen.queryByText('Calculation details')).toBeNull();
});
