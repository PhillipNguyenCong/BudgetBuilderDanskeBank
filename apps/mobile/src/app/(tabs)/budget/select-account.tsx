import { useRouter } from 'expo-router';
import { AccountSelectionScreen } from '../../../features/budget/screens/AccountSelectionScreen';
export default function SelectAccount() {
  const router = useRouter();
  return (
    <AccountSelectionScreen
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/budget'))}
      onContinue={(accountId) => router.push({ pathname: '/budget/create', params: { accountId } })}
    />
  );
}
