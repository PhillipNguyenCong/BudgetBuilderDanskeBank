import type { Budget, ClassifiedTransaction, TransactionDecision } from '@budget-builder/contracts';
import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from '../../../foundation/components/AppText';
import { Button } from '../../../foundation/components/Button';
import { spacing } from '../../../foundation/theme/theme';
import { ApiError } from '../../../lib/api';
import { correctBudgetTransaction, getBudgetTransaction } from '../api';
import { SavedBudgetModal } from '../components/SavedBudgetModal';
import { formatDkk } from '../../budget-shared';

export function TransactionCorrection({
  budget,
  initial,
  onClose,
  onSaved,
  onRestoreFocus,
  save = correctBudgetTransaction,
  reload = getBudgetTransaction,
}: {
  budget: Budget;
  initial: ClassifiedTransaction;
  onClose: () => void;
  onSaved: () => void;
  onRestoreFocus: () => void;
  save?: typeof correctBudgetTransaction;
  reload?: typeof getBudgetTransaction;
}) {
  const [record, setRecord] = useState(initial);
  const [decision, setDecision] = useState<TransactionDecision | null>(
    initial.origin === 'CUSTOMER' ? { kind: initial.kind, potId: initial.potId } : null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [mustReload, setMustReload] = useState(false);
  const [planChanged, setPlanChanged] = useState(false);
  const choice = (label: string, value: TransactionDecision | null) => (
    <Button
      key={label}
      label={`${JSON.stringify(decision) === JSON.stringify(value) ? 'Selected · ' : ''}${label}`}
      variant="secondary"
      disabled={busy || mustReload}
      onPress={() => setDecision(value)}
    />
  );
  async function submit() {
    if (busy || mustReload) return;
    setBusy(true);
    setError('');
    try {
      await save(
        budget.id,
        record.transaction.id,
        record.correctionRevision,
        budget.revision,
        decision,
      );
      onSaved();
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'Could not save classification. Your choice is still here.',
      );
      const stale =
        failure instanceof ApiError && (failure.outcomeUnknown || failure.status === 409);
      setMustReload(stale);
      setPlanChanged(failure instanceof ApiError && failure.code === 'PLAN_CHANGED');
    } finally {
      setBusy(false);
    }
  }
  async function reloadLatest() {
    setBusy(true);
    try {
      const latest = await reload(budget.id, record.transaction.id);
      setRecord(latest);
      setDecision(latest.origin === 'CUSTOMER' ? { kind: latest.kind, potId: latest.potId } : null);
      setMustReload(false);
      setError('');
    } catch {
      setError('Could not reload the latest classification. Your choice is still here.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <SavedBudgetModal
      title="Transaction classification"
      onClose={onClose}
      onRestoreFocus={onRestoreFocus}
      busy={busy}
    >
      <AppText variant="heading">{record.transaction.text}</AppText>
      <AppText>
        {record.transaction.date ?? 'Date unknown'} ·{' '}
        {record.transaction.amountOere === null
          ? 'Amount unavailable'
          : formatDkk(record.transaction.amountOere)}
      </AppText>
      <AppText>{record.reason}</AppText>
      {record.transaction.issues.map((issue, index) => (
        <AppText key={`${issue.code}:${index}`} variant="small">
          Source note: {issue.message}
        </AppText>
      ))}
      {record.exclusionReason ? <AppText>{record.exclusionReason}</AppText> : null}
      <AppText variant="small">
        Only classification changes. Original bank records and your budget plan remain intact.
      </AppText>
      <View style={styles.choices}>
        {choice('Use automatic assignment', null)}
        {record.transaction.direction === 'DEBIT'
          ? budget.plan.pots
              .filter((p) => p.type !== 'SAVINGS')
              .map((p) => choice(`Expense · ${p.name}`, { kind: 'EXPENSE', potId: p.id }))
          : null}
        {record.transaction.direction === 'CREDIT' ? (
          <>
            {choice('Credit · keep separate from spending', { kind: 'CREDIT', potId: null })}
            {budget.plan.pots
              .filter((p) => p.type !== 'SAVINGS')
              .map((p) => choice(`Refund · ${p.name}`, { kind: 'REFUND', potId: p.id }))}
          </>
        ) : null}
        {choice('Transfer · exclude from spending', { kind: 'TRANSFER', potId: null })}
      </View>
      {error ? <AppText accessibilityRole="alert">{error}</AppText> : null}
      {planChanged ? (
        <AppText>
          Close this view and refresh the budget before correcting this transaction.
        </AppText>
      ) : mustReload ? (
        <Button
          label="Reload latest classification (discard unsaved choice)"
          onPress={() => void reloadLatest()}
          disabled={busy}
        />
      ) : null}
      <Button
        label={busy ? 'Saving…' : 'Save classification'}
        disabled={busy || mustReload}
        onPress={() => void submit()}
      />
    </SavedBudgetModal>
  );
}
const styles = StyleSheet.create({ choices: { gap: spacing.medium } });
