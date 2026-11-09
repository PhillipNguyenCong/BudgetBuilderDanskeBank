import { useLocalSearchParams, usePreventRemove, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import type { Budget } from '@budget-builder/contracts';
import { CreateBudgetScreen } from '../../../features/budget/screens/CreateBudgetScreen';

export default function CreateBudget() {
  const router = useRouter();
  const params = useLocalSearchParams<{ accountId?: string | string[] }>();
  const accountId = typeof params.accountId === 'string' ? params.accountId : '';
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  function confirmDiscard(leave: () => void) {
    if (busy) {
      Alert.alert('Saving budget', 'Please wait for the save result before leaving.');
      return;
    }
    Alert.alert('Discard budget draft?', 'Your entered plan has not been saved.', [
      { text: 'Keep editing', style: 'cancel' },
      {
        text: 'Discard draft',
        style: 'destructive',
        onPress: () => {
          setDirty(false);
          disablePrevention();
          leave();
        },
      },
    ]);
  }
  const disablePrevention = usePreventRemove(dirty || busy, ({ repeat }) => confirmDiscard(repeat));
  function openSaved(budget: Budget) {
    setDirty(false);
    setBusy(false);
    disablePrevention();
    router.dismissTo({ pathname: '/budget', params: { budgetId: budget.id } });
  }
  return (
    <CreateBudgetScreen
      key={accountId}
      accountId={accountId}
      onBack={() => {
        const leave = () => router.dismissTo('/budget/select-account');
        if (dirty || busy) confirmDiscard(leave);
        else leave();
      }}
      onDirty={() => setDirty(true)}
      onBusy={setBusy}
      onCreated={openSaved}
      onOpenExisting={(budget) =>
        Alert.alert(
          'Open saved budget?',
          'Your unsaved draft will be discarded. The saved plan will not be changed.',
          [
            { text: 'Keep editing', style: 'cancel' },
            { text: 'Open saved budget', onPress: () => openSaved(budget) },
          ],
        )
      }
    />
  );
}
