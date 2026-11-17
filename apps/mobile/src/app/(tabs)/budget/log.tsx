import { useIsFocused, useLocalSearchParams, useRouter } from 'expo-router';
import { BudgetLogScreen } from '../../../features/budget-overview';
export default function Log() {
  const router = useRouter();
  const active = useIsFocused();
  const params = useLocalSearchParams<{
    budgetId?: string | string[];
    month?: string | string[];
  }>();
  const budgetId = typeof params.budgetId === 'string' ? params.budgetId : '';
  const month = typeof params.month === 'string' ? params.month : undefined;
  return (
    <BudgetLogScreen
      key={budgetId}
      budgetId={budgetId}
      active={active}
      onBack={() =>
        router.canGoBack()
          ? router.back()
          : router.replace({ pathname: '/budget', params: { budgetId, month } })
      }
      onOpenMonth={(month) =>
        router.dismissTo({ pathname: '/budget', params: { budgetId, month } })
      }
    />
  );
}
