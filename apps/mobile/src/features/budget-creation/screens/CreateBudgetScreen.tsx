import { useSalarySuggestion } from '../hooks/useSalarySuggestion';
import type { Budget } from '@budget-builder/contracts';
import { useEffect, useMemo, useState, useRef, type ComponentRef } from 'react';
import { AccessibilityInfo, BackHandler, Keyboard, StyleSheet, View } from 'react-native';
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
  step: controlledStep,
  onStepChange,
  onBack,
  onCreated,
  onOpenExisting,
  onDirty,
  onBusy,
  services = creationServices,
}: {
  step?: 'allocate' | 'review';
  onStepChange?: (step: 'allocate' | 'review') => void;
  accountId: string;
  onBack: () => void;
  onCreated: (budget: Budget) => void;
  onOpenExisting: (budget: Budget) => void;
  onDirty: () => void;
  onBusy: (busy: boolean) => void;
  services?: CreationServices;
}) {
  const [localStep, setLocalStep] = useState<'allocate' | 'review'>('allocate');
  const step = controlledStep ?? localStep;
  const setStep = onStepChange ?? setLocalStep;
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
  useEffect(() => {
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      if (step !== 'review') return false;
      if (!flow.busy) setStep('allocate');
      return true;
    });
    return () => back.remove();
  }, [step, flow.busy, setStep]);
  return (
    <>
      <Screen contentStyle={styles.screen} scrollResetKey={step}>
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
            title={step === 'review' ? 'Review budget' : 'Create budget'}
            onBack={() => {
              if (step === 'review') setStep('allocate');
              else onBack();
            }}
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
                creationStep={step}
                onNext={() => setStep('review')}
                reviewAccount={
                  flow.state.status === 'ready'
                    ? `${flow.state.data.account.name} · ${flow.state.data.account.maskedIdentifier ?? 'Identifier unavailable'}`
                    : undefined
                }
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
