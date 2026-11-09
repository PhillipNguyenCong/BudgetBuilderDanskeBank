import { monthlyBillAllocation } from '@budget-builder/budget-core/allocations';
import type { Budget } from '@budget-builder/contracts';
import { View } from 'react-native';
import { AppText } from '../../../foundation/components/AppText';
import { billFrequencyLabels, formatDkk } from '../../budget-shared';

export function SavedPlanningRow({
  row,
  fixed,
}: {
  row: Extract<Budget['plan']['pots'][number], { type: 'FIXED_EXPENSE' }>['rows'][number];
  fixed: boolean;
}) {
  return (
    <View>
      <AppText>
        {row.label}: {formatDkk(row.amountOere)}
      </AppText>
      {fixed ? (
        <AppText variant="small">
          {billFrequencyLabels[row.frequency ?? 'MONTHLY']} ·{' '}
          {formatDkk(monthlyBillAllocation(row.amountOere, row.frequency))}/month
        </AppText>
      ) : null}
      {row.adjustedByUser ? <AppText variant="small">Adjusted by you</AppText> : null}
      {row.source ? <AppText variant="small">{row.source.explanation}</AppText> : null}
    </View>
  );
}
