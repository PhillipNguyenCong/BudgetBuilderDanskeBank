import type { AllocationProgress } from '@budget-builder/budget-core/allocations';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../foundation/components/AppText';
import { colors, spacing } from '../../../foundation/theme/theme';
import { formatDkk } from '../../budget-shared';

export function AllocationGuidance({
  progress,
  announce = false,
  compact = false,
}: {
  progress: AllocationProgress;
  announce?: boolean;
  compact?: boolean;
}) {
  if (compact && progress.status !== 'ready') return null;
  const message =
    progress.status === 'ready'
      ? progress.remainingOere < 0
        ? compact
          ? `${formatDkk(-progress.remainingOere)} over`
          : `Over-allocated by ${formatDkk(-progress.remainingOere)}`
        : `${formatDkk(progress.remainingOere)} ${compact ? 'left' : 'left to allocate'}`
      : progress.status === 'income-incomplete'
        ? 'Enter all income amounts to see what is left to allocate.'
        : progress.status === 'invalid'
          ? 'Correct invalid amounts to see what is left to allocate.'
          : 'The combined amounts are too large to calculate allocation guidance.';
  return (
    <View style={styles.content}>
      <AppText
        variant={compact ? 'small' : 'label'}
        style={compact ? styles.compact : undefined}
        accessibilityLiveRegion={announce ? 'polite' : 'none'}
        accessibilityHint={
          compact && progress.status === 'ready' && progress.missingPotAmounts > 0
            ? 'Based on entered amounts; some amounts are still missing.'
            : undefined
        }
      >
        {message}
      </AppText>
      {!compact && progress.status === 'ready' && progress.missingPotAmounts > 0 ? (
        <AppText variant="small">Based on amounts entered so far.</AppText>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  content: { gap: spacing.small },
  compact: { textAlign: 'right', fontSize: 12, lineHeight: 16, color: colors.muted },
});
