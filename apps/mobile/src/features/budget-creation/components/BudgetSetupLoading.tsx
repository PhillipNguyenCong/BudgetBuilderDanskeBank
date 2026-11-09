import { ActivityIndicator } from 'react-native';
import { AppText } from '../../../foundation/components/AppText';
export function BudgetSetupLoading() {
  return (
    <>
      <ActivityIndicator accessibilityLabel="Loading budget setup" />
      <AppText>Checking your account…</AppText>
    </>
  );
}
