import type { Budget } from '@budget-builder/contracts';
import { AppText } from '../../../foundation/components/AppText';
import { Card } from '../../../foundation/components/Card';
import { formatDkk } from '../../budget-shared';

export function SavedBudgetTotals({ totals }: { totals: Budget['totals'] }) {
  return (
    <Card>
      <AppText variant="label">Income: {formatDkk(totals.incomeOere)}</AppText>
      <AppText>Allocated: {formatDkk(totals.allocatedOere)}</AppText>
      <AppText variant="heading">Left to allocate: {formatDkk(totals.unallocatedOere)}</AppText>
    </Card>
  );
}
