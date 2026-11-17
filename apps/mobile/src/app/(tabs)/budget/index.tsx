import { useIsFocused, useLocalSearchParams, useRouter } from 'expo-router';
import { BudgetHomeScreen } from '../../../features/budget-overview';
export default function Budget() {
  const router = useRouter();
  const active = useIsFocused();
  const { budgetId, month } = useLocalSearchParams<{
    budgetId?: string | string[];
    month?: string | string[];
  }>();
  const selectedMonth = typeof month === 'string' && month ? month : undefined;
  return (
    <BudgetHomeScreen
      active={active}
      month={selectedMonth}
      onReturnCurrentMonth={() => router.setParams({ month: '' })}
      onOpenBudgetLog={(id) =>
        router.push({ pathname: '/budget/log', params: { budgetId: id, month: selectedMonth } })
      }
      onOpenUndated={(id) =>
        router.push({
          pathname: '/budget/activity',
          params: { budgetId: id, month: selectedMonth, review: 'undated' },
        })
      }
      selectedId={typeof budgetId === 'string' ? budgetId : undefined}
      onSelect={(id) => router.setParams({ budgetId: id, month: '' })}
      onCreate={() => router.push('/budget/select-account')}
      onPreview={() => router.push('/budget/widget-preview')}
      onOpenPot={(id, potId) =>
        router.push({
          pathname: '/budget/pot',
          params: { budgetId: id, potId, month: selectedMonth },
        })
      }
      onOpenActivity={(id) =>
        router.push({
          pathname: '/budget/activity',
          params: { budgetId: id, month: selectedMonth },
        })
      }
    />
  );
}
