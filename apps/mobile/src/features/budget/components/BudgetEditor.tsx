import { useState, type ReactNode } from 'react';
import { View, StyleSheet, Keyboard, ActivityIndicator } from 'react-native';
import type { BudgetPlan } from '@budget-builder/contracts';
import { AppText } from '../../../foundation/components/AppText';
import { Button } from '../../../foundation/components/Button';
import { TextField } from '../../../foundation/components/TextField';
import { spacing } from '../../../foundation/theme/theme';
import {
  createDraft,
  validateDraft,
  nextId,
  newRow,
  amountText,
  type Draft,
  type DraftWidget,
} from '../editor/draft';
import { BudgetWidget, typeLabels } from './BudgetWidget';
import { BudgetWidgetOverlay } from './BudgetWidgetOverlay';
import { SavingsReview } from './SavingsReview';
import { BudgetPlanSummary } from './BudgetPlanSummary';
import { AllocationGuidance } from './AllocationGuidance';
import { Card } from '../../../foundation/components/Card';
import { allocationProgress } from '../editor/allocationProgress';

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
  const [draft, setDraft] = useState(() => {
    const value = createDraft(initialPlan);
    if (startBlank)
      value.widgets.forEach((widget) =>
        widget.rows.forEach((row) => {
          row.input = '';
          row.originalInput = '';
        }),
      );
    return value;
  });
  const [overlayId, setOverlayId] = useState<string>();
  const overlay = draft.widgets.find((widget) => widget.id === overlayId);
  const [reviewSavings, setReviewSavings] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const result = validateDraft(draft);
  const progress = allocationProgress(draft);
  function update(value: Draft) {
    if (busy) return;
    setDraft(value);
    setReviewed(false);
    onDirty?.();
  }
  function changeWidget(widget: DraftWidget) {
    update({
      ...draft,
      widgets: draft.widgets.map((item) => (item.id === widget.id ? widget : item)),
    });
  }
  function addPot(type: BudgetPlan['pots'][number]['type']) {
    const id = nextId(draft);
    const widget: DraftWidget = {
      id,
      name: `New ${typeLabels[type].toLowerCase()}`,
      type,
      color: type === 'SAVINGS' ? 'MINT' : type === 'SPENDING' ? 'SKY' : 'SAND',
      rows: [{ ...newRow(`${id}-row`), label: `New ${typeLabels[type].toLowerCase()}` }],
      ...(type === 'SPENDING'
        ? { rollover: { enabled: false, destination: null, targetPotId: null } }
        : {}),
    };
    update({ ...draft, widgets: [...draft.widgets, widget] });
  }
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
        {draft.widgets.map((widget) => (
          <BudgetWidget
            key={widget.id}
            widget={widget}
            progress={progress}
            onOpen={() => {
              Keyboard.dismiss();
              setOverlayId(widget.id);
            }}
            onChange={changeWidget}
          />
        ))}
        <AppText variant="heading" accessibilityRole="header">
          Add a pot
        </AppText>
        {(['SPENDING', 'FIXED_EXPENSE', 'SAVINGS'] as const).map((type) => (
          <Button
            key={type}
            label={`Add ${typeLabels[type]} pot`}
            variant="secondary"
            disabled={draft.widgets.length >= 101}
            onPress={() => addPot(type)}
          />
        ))}
        <BudgetPlanSummary result={result} onUpdateSavings={() => setReviewSavings(true)} />
        <Button
          label={onSubmit ? 'Create budget' : 'Review draft'}
          disabled={busy || submitDisabled || !!result.error || !result.plan}
          onPress={() => {
            if (onSubmit && result.plan && !result.error) {
              Keyboard.dismiss();
              onSubmit(result.plan);
            } else setReviewed(true);
          }}
        />
        {reviewed && !onSubmit ? (
          <AppText accessibilityLiveRegion="polite">
            Draft valid. This preview does not save a budget.
          </AppText>
        ) : null}
      </View>
      {overlay ? (
        <BudgetWidgetOverlay
          widget={overlay}
          savings={draft.widgets.filter((item) => item.type === 'SAVINGS')}
          progress={progress}
          onChange={changeWidget}
          onAddRow={() =>
            changeWidget({ ...overlay, rows: [...overlay.rows, newRow(nextId(draft))] })
          }
          onClose={() => setOverlayId(undefined)}
        />
      ) : null}
      {feedback}
      {reviewSavings && result.plan ? (
        <SavingsReview
          plan={result.plan}
          onCancel={() => setReviewSavings(false)}
          onApply={(proposal) => {
            update({
              ...draft,
              widgets: draft.widgets.map((widget) =>
                widget.id === proposal.potId
                  ? {
                      ...widget,
                      rows: widget.rows.map((row) =>
                        row.id === proposal.rowId
                          ? {
                              ...row,
                              input: amountText(proposal.afterOere),
                              confirmedAmount: proposal.afterOere,
                            }
                          : row,
                      ),
                    }
                  : widget,
              ),
            });
            setReviewSavings(false);
          }}
        />
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({ content: { gap: spacing.large } });
