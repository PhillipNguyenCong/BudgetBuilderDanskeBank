import { ActivityIndicator } from 'react-native';
import { AppText } from '../../../foundation/components/AppText';
export function BudgetsLoading() {
  return (
    <>
      <ActivityIndicator accessibilityLabel="Loading budgets" />
      <AppText>Loading your budgets…</AppText>
    </>
  );
}
