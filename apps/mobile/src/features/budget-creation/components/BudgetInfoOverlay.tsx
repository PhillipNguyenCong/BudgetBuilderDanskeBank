import type { SalarySuggestion } from '@budget-builder/contracts';
import { useRef, type ComponentRef } from 'react';
import { AccessibilityInfo, Modal, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '../../../foundation/components/AppText';
import { Button } from '../../../foundation/components/Button';
import { colors, spacing } from '../../../foundation/theme/theme';
import type { BudgetSetup } from '../api/setup';

export function BudgetInfoOverlay({
  quality,
  salary,
  salaryMessage,
  onClose,
}: {
  quality?: BudgetSetup['quality'];
  salary?: SalarySuggestion | undefined;
  salaryMessage?: string | undefined;
  onClose: () => void;
}) {
  const heading = useRef<ComponentRef<typeof View>>(null);
  return (
    <Modal
      visible
      testID="budget-info-overlay"
      presentationStyle="fullScreen"
      animationType="slide"
      onRequestClose={onClose}
      onShow={() => {
        if (heading.current) AccessibilityInfo.sendAccessibilityEvent(heading.current, 'focus');
      }}
    >
      <SafeAreaView style={styles.root} accessibilityViewIsModal>
        <View style={styles.header}>
          <View
            ref={heading}
            accessible
            accessibilityRole="header"
            accessibilityLabel="About your budget"
            style={styles.title}
          >
            <AppText variant="heading">About your budget</AppText>
          </View>
          <Button label="Close" variant="secondary" onPress={onClose} />
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <AppText variant="heading">Monthly salary</AppText>
          <AppText>
            {salaryMessage ??
              'The latest eligible salary is filled when available. You can always enter or edit your total monthly income.'}
          </AppText>
          {salary?.suggestion ? (
            <AppText>
              Latest salary payment: {salary.suggestion.paymentDate}. Edits are never overwritten.
            </AppText>
          ) : null}
          <AppText variant="heading">Manual setup</AppText>
          <AppText>
            Enter your monthly income and allocations in DKK with up to two decimal places. Add
            bills looks for possible fixed expenses in your account history when first opened.
            Suggested bills remain editable drafts. Enter zero explicitly where appropriate; blank
            amounts are incomplete.
          </AppText>
          <AppText variant="heading">Your pots</AppText>
          <AppText>
            Pots divide the money in your account. No bank transfer is made. Labels and colours are
            fixed; tap an amount to edit it or open the fixed-expense bill list.
          </AppText>
          <AppText variant="heading">Left to allocate</AppText>
          <AppText>
            This is your income minus all entered spending, fixed expenses and savings amounts. The
            same remainder is shared across all pots. While amounts are missing, it is based on what
            you have entered so far. Invalid amounts pause guidance. Over-allocation means your
            allocations exceed your income.
          </AppText>
          <AppText variant="heading">Bill frequency</AppText>
          <AppText>
            Bills default to Monthly when no frequency is established. You can change this planning
            default. Enter each bill’s amount per payment and choose Monthly, Quarterly, Every 6
            months or Yearly. We divide by 1, 3, 6 or 12 and round each monthly allocation up to the
            nearest øre. This is an average amount to set aside, not a payment schedule or a
            calculation of catch-up funding.
          </AppText>
          <AppText variant="heading">Savings</AppText>
          <AppText>
            Savings stays as entered unless you edit it or confirm an Update savings proposal.
          </AppText>
          <AppText variant="heading">Source history</AppText>
          {quality ? (
            <>
              <AppText>
                Available source history: {quality.coverage.from ?? 'Unknown start'} to{' '}
                {quality.coverage.to ?? 'unknown end'} ({quality.coverage.completeMonths} complete
                months). Bill suggestions use eligible records from this history; other allocations
                remain manual.
              </AppText>
              {quality.issues.length ? (
                <AppText>Some source data is incomplete or uncertain.</AppText>
              ) : null}
            </>
          ) : (
            <AppText>
              Source history will be available after the account check completes. This manual plan
              does not calculate spending from account history.
            </AppText>
          )}
        </ScrollView>
        <View style={styles.footer}>
          <Button label="Done" onPress={onClose} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.medium,
    padding: spacing.large,
  },
  title: { flex: 1 },
  content: { padding: spacing.large, gap: spacing.medium },
  footer: { padding: spacing.large },
});
