import type { Budget } from '@budget-builder/contracts';
import { useState } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';
import { AppText } from '../../../foundation/components/AppText';
import { Button } from '../../../foundation/components/Button';
import { Screen } from '../../../foundation/components/Screen';
import { spacing } from '../../../foundation/theme/theme';
import { BudgetEditor } from '../../budget-editor';
import { BudgetInfoOverlay } from '../components/BudgetInfoOverlay';
import { BudgetSetupError } from '../components/BudgetSetupError';
import { BudgetSetupLoading } from '../components/BudgetSetupLoading';
import { CreationHeader } from '../components/CreationHeader';
import { SaveRecoveryFeedback } from '../components/SaveRecoveryFeedback';
import { manualPlan } from '../editor/manualPlan';
import { creationServices, useBudgetCreation } from '../hooks/useBudgetCreation';

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
  services?: typeof creationServices;
}) {
  const [infoOpen, setInfoOpen] = useState(false);
  const [initialPlan] = useState(manualPlan);
  const flow = useBudgetCreation(accountId, onCreated, onBusy, services);
  return (
    <>
      <Screen>
        <View
          style={styles.content}
          accessibilityElementsHidden={infoOpen}
          importantForAccessibility={infoOpen ? 'no-hide-descendants' : 'auto'}
        >
          <Button label="Back" variant="secondary" disabled={flow.busy} onPress={onBack} />
          <CreationHeader
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
              <AppText variant="label">
                {flow.state.data.account.name} ·{' '}
                {flow.state.data.account.maskedIdentifier ?? 'Identifier unavailable'}
              </AppText>
              <BudgetEditor
                initialPlan={initialPlan}
                startBlank
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
          quality={flow.state.status === 'ready' ? flow.state.data.quality : undefined}
          onClose={() => setInfoOpen(false)}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.large },
});
