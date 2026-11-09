import { useRouter } from 'expo-router';
import { BudgetIntroScreen } from '../../../features/budget/screens/BudgetIntroScreen';
export default function Budget() {
  const router = useRouter();
  return <BudgetIntroScreen onCreate={() => router.push('/budget/select-account')} />;
}
