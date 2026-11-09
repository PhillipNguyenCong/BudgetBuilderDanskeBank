import type { BudgetPlan } from '@budget-builder/contracts';
import { type ReactNode } from 'react';
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

/** Mount with a new key when intentionally switching plans; rerenders never reset a draft. */
export function BudgetEditor({
  initialPlan,
  onDirty,
  startBlank = false,
  onSubmit,
  busy = false,
  submitDisabled = false,
  feedback,
}: {
  initialPlan: BudgetPlan;
  onDirty?: () => void;
  startBlank?: boolean;
  onSubmit?: (plan: BudgetPlan) => void;
  busy?: boolean;
  submitDisabled?: boolean;
  feedback?: ReactNode;
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
    applySavings,
    setOverlayId,
    setReviewSavings,
    setReviewed,
  } = useBudgetEditor({ initialPlan, startBlank, busy, onDirty });
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
          }}
          onChange={changeWidget}
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
          onChange={changeWidget}
          onAddRow={addRow}
          onClose={() => setOverlayId(undefined)}
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
