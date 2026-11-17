import type { AllocationProgress } from '@budget-builder/budget-core/allocations';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../foundation/components/AppText';
import { colors, fonts } from '../../../foundation/theme/theme';
import { formatDkk } from '../../budget-shared';

export function WidgetAllocationStatus({ progress }: { progress: AllocationProgress }) {
  if (progress.status !== 'ready') return null;
  const over = progress.remainingOere < 0;
  return (
    <View style={styles.summary} accessibilityLiveRegion="polite">
      <AppText variant="label">{over ? 'Over-allocated' : 'Left to allocate'}</AppText>
      <AppText
        variant="heading"
        style={styles.amount}
        accessibilityHint={
          progress.missingPotAmounts > 0
            ? 'Based on entered amounts; some amounts are still missing.'
            : undefined
        }
      >
        {formatDkk(over ? -progress.remainingOere : progress.remainingOere)}
      </AppText>
    </View>
  );
}
const styles = StyleSheet.create({
  summary: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  amount: {
    fontSize: 22,
    lineHeight: 28,
    fontFamily: fonts.semibold,
    fontVariant: ['tabular-nums'],
  },
});
