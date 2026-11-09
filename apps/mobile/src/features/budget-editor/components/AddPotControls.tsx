import type { BudgetPlan } from '@budget-builder/contracts';
import { AppText } from '../../../foundation/components/AppText';
import { Button } from '../../../foundation/components/Button';
import { typeLabels } from '../../budget-shared';

export function AddPotControls({
  disabled,
  onAdd,
}: {
  disabled: boolean;
  onAdd: (type: BudgetPlan['pots'][number]['type']) => void;
}) {
  return (
    <>
      <AppText variant="heading" accessibilityRole="header">
        Add a pot
      </AppText>
      {(['SPENDING', 'FIXED_EXPENSE', 'SAVINGS'] as const).map((type) => (
        <Button
          key={type}
          label={`Add ${typeLabels[type]} pot`}
          variant="secondary"
          disabled={disabled}
          onPress={() => onAdd(type)}
        />
      ))}
    </>
  );
}
