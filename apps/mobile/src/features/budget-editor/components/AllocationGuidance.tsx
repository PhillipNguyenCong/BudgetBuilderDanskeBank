import type { AllocationProgress } from '@budget-builder/budget-core/allocations';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../foundation/components/AppText';
import { spacing } from '../../../foundation/theme/theme';
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
  const message =
    progress.status === 'ready'
      ? progress.remainingOere < 0
        ? `Over-allocated by ${formatDkk(-progress.remainingOere)}`
        : `${formatDkk(progress.remainingOere)} left to allocate`
      : progress.status === 'income-incomplete'
        ? compact
          ? 'Income incomplete'
          : 'Enter all income amounts to see what is left to allocate.'
        : progress.status === 'invalid'
          ? compact
            ? 'Check amounts'
            : 'Correct invalid amounts to see what is left to allocate.'
          : compact
            ? 'Amounts too large'
            : 'The combined amounts are too large to calculate allocation guidance.';
  return (
    <View style={styles.content}>
      <AppText
        variant={compact ? 'small' : 'label'}
        style={compact ? styles.compact : undefined}
        accessibilityLiveRegion={announce ? 'polite' : 'none'}
      >
        {message}
      </AppText>
      {progress.status === 'ready' && !compact ? (
        <AppText variant="small">
          {progress.missingPotAmounts > 0 ? 'Based on amounts entered so far. ' : ''}Shared across
          all pots.
        </AppText>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  content: { gap: spacing.small },
  compact: { textAlign: 'right' },
});
