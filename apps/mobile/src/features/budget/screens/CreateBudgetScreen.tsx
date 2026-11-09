import { useState } from 'react';
import { ActivityIndicator, View, Pressable, StyleSheet, Keyboard } from 'react-native';
import type { Budget } from '@budget-builder/contracts';
import { Screen } from '../../../foundation/components/Screen';
import { AppText } from '../../../foundation/components/AppText';
import { Button } from '../../../foundation/components/Button';
import { BudgetInfoOverlay } from '../components/BudgetInfoOverlay';
import { spacing } from '../../../foundation/theme/theme';
import { BudgetEditor } from '../components/BudgetEditor';
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
          <View style={styles.header}>
            <AppText variant="title" accessibilityRole="header" style={styles.title}>
              Create your budget
            </AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="More info"
              disabled={flow.busy}
              accessibilityState={{ disabled: flow.busy }}
              style={styles.info}
              onPress={() => {
                Keyboard.dismiss();
                setInfoOpen(true);
              }}
            >
              <AppText variant="small" style={styles.link}>
                More info
              </AppText>
            </Pressable>
          </View>
          {flow.state.status === 'loading' ? (
            <>
              <ActivityIndicator accessibilityLabel="Loading budget setup" />
              <AppText>Checking your account…</AppText>
            </>
          ) : flow.state.status === 'error' ? (
            <>
              <AppText accessibilityRole="alert">{flow.state.message}</AppText>
              <Button label="Try again" onPress={flow.retry} />
            </>
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
                  <>
                    {flow.error ? <AppText accessibilityRole="alert">{flow.error}</AppText> : null}
                    {flow.needsCheck ? (
                      <Button
                        label={flow.checking ? 'Checking saved budgets…' : 'Check saved budgets'}
                        disabled={flow.checking}
                        onPress={() => void flow.checkSaved()}
                      />
                    ) : null}
                    {flow.checkMessage ? (
                      <AppText accessibilityLiveRegion="polite">{flow.checkMessage}</AppText>
                    ) : null}
                    {flow.existing ? (
                      <Button
                        label="Open saved budget"
                        onPress={() => onOpenExisting(flow.existing!)}
                      />
                    ) : null}
                  </>
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
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.medium },
  title: { flex: 1 },
  info: { minWidth: 44, minHeight: 44, justifyContent: 'center' },
  link: { textDecorationLine: 'underline' },
});
