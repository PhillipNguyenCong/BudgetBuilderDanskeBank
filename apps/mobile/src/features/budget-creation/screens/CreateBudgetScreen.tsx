import { useSalarySuggestion } from '../hooks/useSalarySuggestion';
import type { Budget } from '@budget-builder/contracts';
import { useMemo, useState, useRef, type ComponentRef } from 'react';
import { AccessibilityInfo, Keyboard, StyleSheet, View } from 'react-native';
import { Screen } from '../../../foundation/components/Screen';
import { spacing } from '../../../foundation/theme/theme';
import { BudgetEditor } from '../../budget-editor';
import { BudgetInfoOverlay } from '../components/BudgetInfoOverlay';
import { BudgetSetupError } from '../components/BudgetSetupError';
import { BudgetSetupLoading } from '../components/BudgetSetupLoading';
import { CreationHeader } from '../components/CreationHeader';
import { SaveRecoveryFeedback } from '../components/SaveRecoveryFeedback';
import { manualPlan } from '../editor/manualPlan';
import {
  creationServices,
  useBudgetCreation,
  type CreationServices,
} from '../hooks/useBudgetCreation';

export function CreateBudgetScreen({
  accountId,
  onBack,
  onCreated,
  onOpenExisting,
  onDirty,
  onBusy,
  services = creationServices,
}: {
  accountId: string;
  onBack: () => void;
  onCreated: (budget: Budget) => void;
  onOpenExisting: (budget: Budget) => void;
  onDirty: () => void;
  onBusy: (busy: boolean) => void;
  services?: CreationServices;
}) {
  const infoTrigger = useRef<ComponentRef<typeof View>>(null);
  function closeInfo() {
    setInfoOpen(false);
    requestAnimationFrame(() => {
      if (infoTrigger.current)
        AccessibilityInfo.sendAccessibilityEvent(infoTrigger.current, 'focus');
    });
  }
  const [infoOpen, setInfoOpen] = useState(false);
  const [initialPlan] = useState(manualPlan);
  const salary = useSalarySuggestion(accountId, services.salary);
  const flow = useBudgetCreation(accountId, onCreated, onBusy, services);
  const loadSuggestions = useMemo(
    () =>
      services.suggest ? (signal: AbortSignal) => services.suggest!(accountId, signal) : undefined,
    [services.suggest, accountId],
  );
  return (
    <>
      <Screen contentStyle={styles.screen}>
        <View
          style={styles.content}
          accessibilityElementsHidden={infoOpen}
          importantForAccessibility={infoOpen ? 'no-hide-descendants' : 'auto'}
        >
          <CreationHeader
            accountLabel={
              flow.state.status === 'ready'
                ? `${flow.state.data.account.name} · ${flow.state.data.account.maskedIdentifier ?? 'Identifier unavailable'}`
                : undefined
            }
            onBack={onBack}
            infoRef={infoTrigger}
            busy={flow.busy}
            onInfo={() => {
              Keyboard.dismiss();
              setInfoOpen(true);
            }}
          />
          {flow.state.status === 'loading' ? (
            <BudgetSetupLoading />
          ) : flow.state.status === 'error' ? (
            <BudgetSetupError message={flow.state.message} onRetry={flow.retry} />
          ) : (
            <>
              <BudgetEditor
                initialPlan={initialPlan}
                startBlank
                salarySuggestion={salary?.data}
                loadBillSuggestions={loadSuggestions}
                onDirty={onDirty}
                onSubmit={(plan) => void flow.submit(plan)}
                busy={flow.busy}
                submitDisabled={flow.needsCheck || flow.checking}
                feedback={
                  <SaveRecoveryFeedback
                    error={flow.error}
                    needsCheck={flow.needsCheck}
                    checking={flow.checking}
                    checkMessage={flow.checkMessage}
                    existing={flow.existing}
                    onCheck={() => void flow.checkSaved()}
                    onOpenExisting={onOpenExisting}
                  />
                }
              />
            </>
          )}
        </View>
      </Screen>
      {infoOpen ? (
        <BudgetInfoOverlay
          salary={salary?.data}
          salaryMessage={salary?.message}
          quality={flow.state.status === 'ready' ? flow.state.data.quality : undefined}
          onClose={closeInfo}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  screen: { paddingTop: 8 },
  content: { gap: spacing.medium },
});
