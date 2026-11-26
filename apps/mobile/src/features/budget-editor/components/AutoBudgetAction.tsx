import { useEffect, useRef, type ComponentRef } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '../../../foundation/components/AppText';
import { Button } from '../../../foundation/components/Button';
import { colors, spacing } from '../../../foundation/theme/theme';
import { useAutoBudget, type AutoBudgetOptions } from '../hooks/useAutoBudget';
import { CarExpenseChecklist } from './CarExpenseChecklist';

export function AutoBudgetAction(props: AutoBudgetOptions) {
  const {
    status,
    error,
    outcome,
    notes,
    open,
    close,
    confirm,
    carChoice,
    setCarChoice,
    checklist,
    setChecklist,
    finishCarReview,
  } = useAutoBudget(props);
  const { disabled } = props;
  const trigger = useRef<ComponentRef<typeof View>>(null);
  const heading = useRef<ComponentRef<typeof View>>(null);
  const wasOpen = useRef(false);
  useEffect(() => {
    let frame: number | undefined;
    if (status === 'closed' && wasOpen.current) {
      frame = requestAnimationFrame(() => {
        if (trigger.current) AccessibilityInfo.sendAccessibilityEvent(trigger.current, 'focus');
      });
    }
    if (status === 'car-review')
      frame = requestAnimationFrame(() => {
        if (heading.current) AccessibilityInfo.sendAccessibilityEvent(heading.current, 'focus');
      });
    wasOpen.current = status !== 'closed';
    return () => {
      if (frame !== undefined) cancelAnimationFrame(frame);
    };
  }, [status]);
  const possible =
    outcome?.draft.widgets
      .filter((widget) => widget.type === 'FIXED_EXPENSE')
      .flatMap((widget) => widget.rows)
      .filter((row) => row.suggestionConfidence === 'POSSIBLE').length ?? 0;
  return (
    <>
      <View
        ref={trigger}
        collapsable={false}
        accessibilityElementsHidden={disabled || status !== 'closed'}
        importantForAccessibility={disabled || status !== 'closed' ? 'no-hide-descendants' : 'auto'}
      >
        <Button
          label="Create Auto Budget"
          variant="secondary"
          disabled={disabled || status !== 'closed'}
          onPress={() => {
            Keyboard.dismiss();
            open();
          }}
        />
      </View>
      {outcome && outcome.draft === props.draft ? (
        <View
          style={styles.result}
          accessibilityLiveRegion="polite"
          accessibilityElementsHidden={disabled || status !== 'closed'}
          importantForAccessibility={
            disabled || status !== 'closed' ? 'no-hide-descendants' : 'auto'
          }
        >
          <AppText>
            Auto allocation applied using {outcome.allocation.split}.
            {outcome.allocation.split === '85/5/10'
              ? ' Bills exceeded 50% of income, so the fallback guideline was used.'
              : ''}{' '}
            Review and edit the amounts before saving.
          </AppText>
          {outcome.allocation.groceriesOere === 0 ? (
            <AppText accessibilityRole="alert">
              Groceries is zero. Adjust the amounts to make room for food before saving if needed.
            </AppText>
          ) : null}
          {possible ? (
            <AppText>
              {possible} possible bill{possible === 1 ? '' : 's'} included. Review them in Fixed
              expenses before saving.
            </AppText>
          ) : null}
          {outcome.allocation.fixedExpensesOere === 0 ? (
            <AppText>No bill amounts were found. Check for missing bills before saving.</AppText>
          ) : null}
          {notes.map((note, index) => (
            <AppText key={index} variant="small">
              {note}
            </AppText>
          ))}
        </View>
      ) : null}
      {status !== 'closed' ? (
        <Modal
          testID="auto-budget-confirmation"
          visible
          transparent
          animationType="fade"
          onRequestClose={close}
          onShow={() => {
            if (heading.current) AccessibilityInfo.sendAccessibilityEvent(heading.current, 'focus');
          }}
        >
          <SafeAreaProvider>
            <SafeAreaView style={styles.backdrop} accessibilityViewIsModal>
              <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              >
                <ScrollView
                  contentContainerStyle={styles.viewport}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="on-drag"
                >
                  <View style={styles.dialog}>
                    <View ref={heading} accessible accessibilityRole="header">
                      <AppText variant="heading">
                        {status === 'car-review' ? 'Your car expenses' : 'Create Auto Budget?'}
                      </AppText>
                    </View>
                    {status === 'car-review' ? (
                      <>
                        <CarExpenseChecklist
                          items={checklist}
                          onChange={(item) =>
                            setChecklist((items) =>
                              items.map((current) => (current.kind === item.kind ? item : current)),
                            )
                          }
                        />
                        {error ? (
                          <AppText accessibilityRole="alert" accessibilityLiveRegion="assertive">
                            {error} Your budget draft has not changed.
                          </AppText>
                        ) : null}
                        <Button
                          label="Allocate budget"
                          onPress={() => {
                            Keyboard.dismiss();
                            finishCarReview();
                          }}
                          disabled={disabled}
                        />
                      </>
                    ) : (
                      <>
                        <AppText>
                          Include detected recurring and possible bills, preserve edited bills, and
                          replace your Groceries, Fun budget and Savings amounts. Previously
                          dismissed bills stay excluded.
                        </AppText>
                        <AppText>
                          50/30/20: bills and groceries share 50% of take-home income, Fun gets 30%,
                          and Savings gets 20%.
                        </AppText>
                        <AppText>
                          If bills exceed 50%, switch to 85/5/10: bills and groceries share 85%, Fun
                          gets 5%, and Savings gets 10%. Groceries receives what remains after
                          bills.
                        </AppText>
                        <AppText variant="small">
                          These are flexible guidelines. Bills above 85% or incomplete data prevent
                          auto allocation. You can edit the result; nothing is saved until you
                          choose Create budget on the review page.
                        </AppText>
                        {status !== 'loading' ? (
                          <View style={styles.question}>
                            <AppText variant="label">Do you have a car?</AppText>
                            {(['yes', 'no'] as const).map((choice) => (
                              <Pressable
                                key={choice}
                                accessibilityRole="radio"
                                accessibilityLabel={
                                  choice === 'yes' ? 'Yes, I have a car' : 'No, I do not have a car'
                                }
                                accessibilityState={{ checked: carChoice === choice }}
                                onPress={() => setCarChoice(choice)}
                                style={styles.carChoice}
                              >
                                <AppText>
                                  {carChoice === choice ? '✓ ' : ''}
                                  {choice === 'yes' ? 'Yes — review common car costs' : 'No'}
                                </AppText>
                              </Pressable>
                            ))}
                          </View>
                        ) : null}
                        {status === 'loading' ? (
                          <>
                            <ActivityIndicator accessibilityLabel="Allocating budget" />
                            <AppText accessibilityLiveRegion="polite">
                              Finding bills and allocating your budget…
                            </AppText>
                          </>
                        ) : status === 'error' ? (
                          <AppText accessibilityRole="alert" accessibilityLiveRegion="assertive">
                            {error} Auto allocation has not changed your draft.
                          </AppText>
                        ) : null}
                        {status !== 'loading' ? (
                          <Button
                            label={status === 'error' ? 'Try again' : 'Confirm'}
                            onPress={() => void confirm()}
                            disabled={disabled || carChoice === null}
                          />
                        ) : null}
                      </>
                    )}
                    <Button
                      label={status === 'loading' ? 'Cancel allocation' : 'Cancel'}
                      variant="secondary"
                      onPress={close}
                    />
                  </View>
                </ScrollView>
              </KeyboardAvoidingView>
            </SafeAreaView>
          </SafeAreaProvider>
        </Modal>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0, 20, 40, 0.45)' },
  viewport: { flexGrow: 1, justifyContent: 'center', padding: spacing.large },
  dialog: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.large,
    gap: spacing.medium,
  },
  result: { gap: spacing.small },
  question: { gap: spacing.small },
  carChoice: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.small },
});
