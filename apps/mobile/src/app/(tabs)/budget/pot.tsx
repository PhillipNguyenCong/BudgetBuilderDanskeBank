import { useIsFocused, useLocalSearchParams, useRouter } from 'expo-router';
import { BudgetActivityScreen } from '../../../features/budget-overview';
export default function Pot() {
  const router = useRouter();
  const active = useIsFocused();
  const params = useLocalSearchParams<{
    budgetId?: string | string[];
    month?: string | string[];
    review?: string | string[];
    potId?: string | string[];
  }>();
  const month = typeof params.month === 'string' && params.month ? params.month : undefined;
  const review = params.review === 'undated' ? 'undated' : undefined;
  const budgetId = typeof params.budgetId === 'string' ? params.budgetId : '';
  const potId = typeof params.potId === 'string' ? params.potId : '';
  return (
    <BudgetActivityScreen
      key={`${budgetId}:${potId}`}
      budgetId={budgetId}
      month={month}
      review={review}
      potId={potId || '__missing__'}
      active={active}
      onBack={() =>
        router.canGoBack()
          ? router.back()
          : router.replace({ pathname: '/budget', params: { budgetId, month } })
      }
      onOpenActivity={() =>
        router.push({ pathname: '/budget/activity', params: { budgetId, month } })
      }
    />
  );
}
