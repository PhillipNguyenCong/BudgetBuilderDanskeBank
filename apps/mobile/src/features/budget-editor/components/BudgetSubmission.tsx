import type { BudgetPlan } from '@budget-builder/contracts';
import { Keyboard } from 'react-native';
import { AppText } from '../../../foundation/components/AppText';
import { Button } from '../../../foundation/components/Button';
import { validateDraft } from '../editor/draft';

export function BudgetSubmission({
  onSubmit,
  result,
  busy,
  submitDisabled,
  reviewed,
  onReview,
}: {
  onSubmit?: (plan: BudgetPlan) => void;
  result: ReturnType<typeof validateDraft>;
  busy: boolean;
  submitDisabled: boolean;
  reviewed: boolean;
  onReview: () => void;
}) {
  return (
    <>
      <Button
        label={onSubmit ? 'Create budget' : 'Review draft'}
        disabled={busy || submitDisabled || !!result.error || !result.plan}
        onPress={() => {
          if (onSubmit && result.plan && !result.error) {
            Keyboard.dismiss();
            onSubmit(result.plan);
          } else onReview();
        }}
      />
      {reviewed && !onSubmit ? (
        <AppText accessibilityLiveRegion="polite">
          Draft valid. This preview does not save a budget.
        </AppText>
      ) : null}
    </>
  );
}
