import { useIsFocused, useLocalSearchParams, useRouter } from 'expo-router';
import { BudgetActivityScreen } from '../../../features/budget-overview';
export default function Activity() {
  const router = useRouter();
  const active = useIsFocused();
  const params = useLocalSearchParams<{ budgetId?: string | string[] }>();
  const budgetId = typeof params.budgetId === 'string' ? params.budgetId : '';
  return (
    <BudgetActivityScreen
      key={budgetId}
      budgetId={budgetId}
      active={active}
      onBack={() =>
        router.canGoBack()
          ? router.back()
          : router.replace({ pathname: '/budget', params: { budgetId } })
      }
      onOpenActivity={() => {}}
    />
  );
}
