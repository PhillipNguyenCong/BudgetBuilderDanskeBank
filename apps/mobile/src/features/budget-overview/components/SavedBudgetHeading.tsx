import type { Budget } from '@budget-builder/contracts';
import type { ComponentRef, RefObject } from 'react';
import { View } from 'react-native';
import { AppText } from '../../../foundation/components/AppText';

export function SavedBudgetHeading({
  budget,
  focusTarget,
}: {
  budget: Budget;
  focusTarget?: RefObject<ComponentRef<typeof View> | null>;
}) {
  return (
    <>
      <View
        ref={focusTarget}
        accessible
        accessibilityRole="header"
        accessibilityLabel={budget.plan.name}
      >
        <AppText variant="title">{budget.plan.name}</AppText>
      </View>
    </>
  );
}
