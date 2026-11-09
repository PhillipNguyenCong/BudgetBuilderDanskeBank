import { proposeSavingsUpdate } from '@budget-builder/budget-core/allocations';
import type { BudgetPlan } from '@budget-builder/contracts';
import { useState } from 'react';
import { Modal, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '../../../foundation/components/AppText';
import { Button } from '../../../foundation/components/Button';
import { colors, spacing } from '../../../foundation/theme/theme';
import { formatDkk } from '../../budget-shared';

export type SavingsProposal = ReturnType<typeof proposeSavingsUpdate>;
export function SavingsReview({
  plan,
  onApply,
  onCancel,
}: {
  plan: BudgetPlan;
  onApply: (proposal: SavingsProposal) => void;
  onCancel: () => void;
}) {
  const [proposal, setProposal] = useState<SavingsProposal>();
  const [error, setError] = useState<string>();
  const choices = plan.pots
    .filter((pot) => pot.type === 'SAVINGS')
    .flatMap((pot) => pot.rows.map((row) => ({ pot, row })));
  const chosen = choices.find(
    ({ pot, row }) => pot.id === proposal?.potId && row.id === proposal.rowId,
  );
  return (
    <Modal visible animationType="slide" onRequestClose={onCancel}>
      <SafeAreaView style={styles.root}>
        <ScrollView contentContainerStyle={styles.content} accessibilityViewIsModal>
          <AppText variant="title" accessibilityRole="header">
            Update savings
          </AppText>
          <AppText>
            Choose one savings row to receive the unallocated amount. Other rows stay unchanged.
            This may increase or reduce that row.
          </AppText>
          {choices.length === 0 ? (
            <AppText>Add a named savings row with an amount before reviewing an update.</AppText>
          ) : null}
          {choices.map(({ pot, row }) => (
            <Button
              key={row.id}
              variant="secondary"
              label={`Review ${pot.name} / ${row.label}`}
              onPress={() => {
                setError(undefined);
                try {
                  setProposal(proposeSavingsUpdate(plan, pot.id, row.id));
                } catch {
                  setProposal(undefined);
                  setError(
                    'This row cannot cover the shortfall. Adjust other allocations or income first.',
                  );
                }
              }}
            />
          ))}
          {error ? <AppText accessibilityRole="alert">{error}</AppText> : null}
          {proposal && chosen ? (
            <>
              <AppText variant="heading">
                {chosen.pot.name} / {chosen.row.label}
              </AppText>
              <AppText>
                {formatDkk(proposal.beforeOere)} → {formatDkk(proposal.afterOere)}
              </AppText>
              <AppText>
                Pot total: {formatDkk(proposal.beforePotOere)} → {formatDkk(proposal.afterPotOere)}
              </AppText>
              <AppText>No other rows or pots will change.</AppText>
              <Button label="Apply savings update" onPress={() => onApply(proposal)} />
            </>
          ) : null}
          <Button label="Cancel savings update" variant="secondary" onPress={onCancel} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: spacing.screen, gap: spacing.large },
});
