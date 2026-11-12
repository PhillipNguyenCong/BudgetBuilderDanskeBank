import { useIsFocused, useLocalSearchParams, useRouter } from 'expo-router';
import { BudgetHomeScreen } from '../../../features/budget-overview';
export default function Budget() {
  const router = useRouter();
  const active = useIsFocused();
  const { budgetId } = useLocalSearchParams<{ budgetId?: string | string[] }>();
  return (
    <BudgetHomeScreen
      active={active}
      selectedId={typeof budgetId === 'string' ? budgetId : undefined}
      onSelect={(id) => router.setParams({ budgetId: id })}
      onCreate={() => router.push('/budget/select-account')}
      onPreview={() => router.push('/budget/widget-preview')}
      onOpenPot={(id, potId) =>
        router.push({ pathname: '/budget/pot', params: { budgetId: id, potId } })
      }
      onOpenActivity={(id) =>
        router.push({ pathname: '/budget/activity', params: { budgetId: id } })
      }
    />
  );
}
