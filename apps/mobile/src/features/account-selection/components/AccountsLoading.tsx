import { ActivityIndicator } from 'react-native';
import { AppText } from '../../../foundation/components/AppText';
export function AccountsLoading() {
  return (
    <>
      <ActivityIndicator accessibilityLabel="Loading accounts" />
      <AppText accessibilityLiveRegion="polite">Loading your accounts…</AppText>
    </>
  );
}
