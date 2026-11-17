import type { SalarySuggestion, BudgetPlan } from '@budget-builder/contracts';
import { billIdentityKeys } from '@budget-builder/budget-core/bill-matching';
import { useRef, type ReactNode } from 'react';
import { ActivityIndicator, Keyboard, StyleSheet, View } from 'react-native';
import { AppText } from '../../../foundation/components/AppText';
import { TextField } from '../../../foundation/components/TextField';
import { spacing } from '../../../foundation/theme/theme';
import { useBudgetEditor } from '../hooks/useBudgetEditor';
import { BudgetPlanSummary } from './BudgetPlanSummary';
import { BudgetSubmission } from './BudgetSubmission';
import { BudgetWidgetList } from './BudgetWidgetList';
import { BudgetWidgetOverlay } from './BudgetWidgetOverlay';
import { SavingsReview } from './SavingsReview';
import { useBillSuggestions, type BillSuggestionLoader } from '../hooks/useBillSuggestions';
import { remainingBillSuggestions } from '../editor/suggestedBills';
import { BillSuggestionPanel } from './BillSuggestionPanel';
import { formatDkk } from '../../budget-shared';
import { BudgetReview } from './BudgetReview';
import { Button } from '../../../foundation/components/Button';
import { validateDraft, type DraftWidget } from '../editor/draft';

/** Mount with a new key when intentionally switching plans; rerenders never reset a draft. */
export function BudgetEditor({
  initialPlan,
  salarySuggestion,
  onDirty,
  startBlank = false,
  onSubmit,
  busy = false,
  submitDisabled = false,
  feedback,
  loadBillSuggestions,
  creationStep,
  onNext,
  reviewAccount,
}: {
  creationStep?: 'allocate' | 'review';
  onNext?: () => void;
  reviewAccount?: string;
  initialPlan: BudgetPlan;
  salarySuggestion?: SalarySuggestion | undefined;
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
    addRow,
    addSuggestedBills,
    commitAmount,
    applySavings,
    setOverlayId,
    setReviewSavings,
    setReviewed,
  } = useBudgetEditor({ initialPlan, startBlank, busy, onDirty, salarySuggestion });
  // Validate allocation independently so an unfinished review rule cannot trap Back navigation.
  const allocationResult = creationStep
    ? validateDraft({
        ...draft,
        widgets: draft.widgets.map((widget) =>
          widget.type === 'SPENDING'
            ? { ...widget, rollover: { enabled: false, destination: null, targetPotId: null } }
            : widget,
        ),
      })
    : result;
  const inReview = creationStep === 'review';
  const balanced =
    !!allocationResult.plan &&
    !allocationResult.error &&
    allocationResult.totals?.unallocatedOere === 0;
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
        {!inReview ? (
          <>
            <TextField
              keyboardDone
              label="Budget name"
              value={draft.name}
              maxLength={100}
              placeholder="e.g. Everyday budget"
              onChangeText={(name) => update({ ...draft, name })}
            />
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
          </>
        ) : null}
        {!creationStep || inReview ? (
          <BudgetPlanSummary
            result={result}
            widgets={draft.widgets}
            onChange={change}
            reviewOnly={inReview}
            onUpdateSavings={() => {
              Keyboard.dismiss();
              setReviewSavings(true);
            }}
          />
        ) : null}
        {inReview && allocationResult.plan && allocationResult.totals ? (
          <BudgetReview
            plan={allocationResult.plan}
            totals={allocationResult.totals}
            account={reviewAccount}
          />
        ) : null}
        {creationStep === 'allocate' ? (
          <>
            {allocationResult.error ? (
              <AppText accessibilityRole="alert">{allocationResult.error}</AppText>
            ) : null}
            {allocationResult.totals && allocationResult.totals.unallocatedOere > 0 ? (
              <AppText accessibilityLiveRegion="polite">
                Allocate the remaining {formatDkk(allocationResult.totals.unallocatedOere)} to
                continue.
              </AppText>
            ) : null}
            <Button
              label="Next"
              disabled={!balanced || busy}
              onPress={() => {
                Keyboard.dismiss();
                draft.widgets.forEach((widget) =>
                  widget.rows.forEach((row) => commitAmount(row.id)),
                );
                onNext?.();
              }}
            />
          </>
        ) : (
          <BudgetSubmission
            onSubmit={onSubmit}
            result={result}
            busy={busy}
            submitDisabled={submitDisabled || (inReview && !balanced)}
            reviewed={reviewed}
            onReview={() => setReviewed(true)}
          />
        )}
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
      {!creationStep || inReview ? feedback : null}
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
  content: { gap: spacing.medium },
});
