import type { Budget } from '@budget-builder/contracts';
import { AppText } from '../../../foundation/components/AppText';

export function SavedBudgetHeading({ budget }: { budget: Budget }) {
  return (
    <>
      <AppText variant="title" accessibilityRole="header">
        {budget.plan.name}
      </AppText>
      <AppText>Saved monthly plan</AppText>
      <AppText variant="small">
        Last saved: {budget.updatedAt.slice(0, 10)}. Allocations below are planned amounts, not
        account balances.
      </AppText>
    </>
  );
}
