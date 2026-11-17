import { useIsFocused, useLocalSearchParams, useRouter } from 'expo-router';
import { BudgetActivityScreen } from '../../../features/budget-overview';
export default function Activity() {
  const router = useRouter();
  const active = useIsFocused();
  const params = useLocalSearchParams<{
    budgetId?: string | string[];
    month?: string | string[];
    review?: string | string[];
  }>();
  const month = typeof params.month === 'string' && params.month ? params.month : undefined;
  const review = params.review === 'undated' ? 'undated' : undefined;
  const budgetId = typeof params.budgetId === 'string' ? params.budgetId : '';
  return (
    <BudgetActivityScreen
      key={budgetId}
      budgetId={budgetId}
      month={month}
      review={review}
      active={active}
      onBack={() =>
        router.canGoBack()
          ? router.back()
          : router.replace({ pathname: '/budget', params: { budgetId, month } })
      }
      onOpenActivity={() => {}}
    />
  );
}
