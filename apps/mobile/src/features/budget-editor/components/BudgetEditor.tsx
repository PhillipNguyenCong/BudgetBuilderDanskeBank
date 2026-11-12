import type { BudgetPlan } from '@budget-builder/contracts';
import { billIdentityKeys } from '@budget-builder/budget-core/bill-matching';
import { useRef, type ReactNode } from 'react';
import { ActivityIndicator, Keyboard, StyleSheet, View } from 'react-native';
import { AppText } from '../../../foundation/components/AppText';
import { Card } from '../../../foundation/components/Card';
import { TextField } from '../../../foundation/components/TextField';
import { spacing } from '../../../foundation/theme/theme';
import { useBudgetEditor } from '../hooks/useBudgetEditor';
import { AddPotControls } from './AddPotControls';
import { AllocationGuidance } from './AllocationGuidance';
import { BudgetPlanSummary } from './BudgetPlanSummary';
import { BudgetSubmission } from './BudgetSubmission';
import { BudgetWidgetList } from './BudgetWidgetList';
import { BudgetWidgetOverlay } from './BudgetWidgetOverlay';
import { SavingsReview } from './SavingsReview';
import { useBillSuggestions, type BillSuggestionLoader } from '../hooks/useBillSuggestions';
import { remainingBillSuggestions } from '../editor/suggestedBills';
import { BillSuggestionPanel } from './BillSuggestionPanel';
import type { DraftWidget } from '../editor/draft';

/** Mount with a new key when intentionally switching plans; rerenders never reset a draft. */
export function BudgetEditor({
  initialPlan,
  onDirty,
  startBlank = false,
  onSubmit,
  busy = false,
  submitDisabled = false,
  feedback,
  loadBillSuggestions,
}: {
  initialPlan: BudgetPlan;
  onDirty?: () => void;
  startBlank?: boolean;
  onSubmit?: (plan: BudgetPlan) => void;
  busy?: boolean;
  submitDisabled?: boolean;
  feedback?: ReactNode;
  loadBillSuggestions?: BillSuggestionLoader | undefined;
}) {
  const {
    draft,
    overlay,
    reviewSavings,
    reviewed,
    result,
    progress,
    update,
    changeWidget,
    addPot,
    addRow,
    addSuggestedBills,
    commitAmount,
    applySavings,
    setOverlayId,
    setReviewSavings,
    setReviewed,
  } = useBudgetEditor({ initialPlan, startBlank, busy, onDirty });
  const activeOverlay = useRef<string | undefined>(undefined);
  const touchedBills = useRef(new Set<string>());
  const discovery = useBillSuggestions(loadBillSuggestions, (data, targetId, auto) => {
    if (
      auto &&
      activeOverlay.current === targetId &&
      !touchedBills.current.has(targetId) &&
      !busy
    ) {
      addSuggestedBills(
        targetId,
        remainingBillSuggestions(
          draft,
          data.suggestions.filter((s) => s.confidence === 'RECURRING'),
          discovery.dismissed,
        ),
        true,
      );
    }
  });
  function change(widget: DraftWidget) {
    const previous = draft.widgets.find((item) => item.id === widget.id);
    if (widget.type === 'FIXED_EXPENSE' && previous && previous.rows !== widget.rows) {
      touchedBills.current.add(widget.id);
      const removed = previous.rows
        .filter((row) => !widget.rows.some((item) => item.id === row.id))
        .flatMap((row) => (row.match ? billIdentityKeys(row.match) : []));
      if (removed.length) discovery.dismiss(removed);
    }
    changeWidget(widget);
  }
  const remaining = remainingBillSuggestions(
    draft,
    discovery.state.data?.suggestions ?? [],
    discovery.dismissed,
  );
  return (
    <View style={styles.content}>
      {busy ? (
        <>
          <ActivityIndicator accessibilityLabel="Saving budget" />
          <AppText accessibilityLiveRegion="polite">Saving budget…</AppText>
        </>
      ) : null}
      <View
        style={styles.content}
        pointerEvents={busy ? 'none' : 'auto'}
        accessibilityElementsHidden={busy || !!overlay}
        importantForAccessibility={busy || overlay ? 'no-hide-descendants' : 'auto'}
      >
        <TextField
          label="Budget name"
          value={draft.name}
          maxLength={100}
          error={!draft.name.trim() ? 'Enter a budget name.' : undefined}
          onChangeText={(name) => update({ ...draft, name })}
        />
        <Card>
          <AllocationGuidance progress={progress} announce />
        </Card>
        <BudgetWidgetList
          widgets={draft.widgets}
          progress={progress}
          onOpen={(id) => {
            Keyboard.dismiss();
            setOverlayId(id);
            activeOverlay.current = id;
            if (draft.widgets.find((widget) => widget.id === id)?.type === 'FIXED_EXPENSE')
              discovery.open(id);
          }}
          onChange={change}
          onAmountBlur={commitAmount}
        />
        <AddPotControls disabled={draft.widgets.length >= 101} onAdd={addPot} />
        <BudgetPlanSummary result={result} onUpdateSavings={() => setReviewSavings(true)} />
        <BudgetSubmission
          onSubmit={onSubmit}
          result={result}
          busy={busy}
          submitDisabled={submitDisabled}
          reviewed={reviewed}
          onReview={() => setReviewed(true)}
        />
      </View>
      {overlay ? (
        <BudgetWidgetOverlay
          widget={overlay}
          savings={draft.widgets.filter((item) => item.type === 'SAVINGS')}
          progress={progress}
          onChange={change}
          onAddRow={() => {
            touchedBills.current.add(overlay.id);
            addRow();
          }}
          onClose={() => {
            touchedBills.current.add(overlay.id);
            activeOverlay.current = undefined;
            setOverlayId(undefined);
          }}
          suggestionPanel={
            loadBillSuggestions && overlay.type === 'FIXED_EXPENSE' ? (
              <BillSuggestionPanel
                state={discovery.state}
                remaining={remaining}
                disabled={busy || overlay.rows.length >= 1000}
                onAdd={() => addSuggestedBills(overlay.id, remaining)}
                onRefresh={() => discovery.refresh(overlay.id)}
              />
            ) : undefined
          }
          onAmountBlur={commitAmount}
        />
      ) : null}
      {feedback}
      {reviewSavings && result.plan ? (
        <SavingsReview
          plan={result.plan}
          onCancel={() => setReviewSavings(false)}
          onApply={applySavings}
        />
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  content: { gap: spacing.large },
});
