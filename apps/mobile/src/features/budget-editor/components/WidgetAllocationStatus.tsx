import type { AllocationProgress } from '@budget-builder/budget-core/allocations';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../foundation/components/AppText';
import { spacing } from '../../../foundation/theme/theme';
import { AllocationGuidance } from './AllocationGuidance';

export function WidgetAllocationStatus({
  progress,
  widgetId,
}: {
  progress: AllocationProgress;
  widgetId: string;
}) {
  const status = progress.pots.find((pot) => pot.id === widgetId)?.status;
  return (
    <View style={styles.row}>
      <View style={styles.cell} />
      <View style={styles.cell}>
        {progress.status !== 'invalid' &&
        progress.status !== 'overflow' &&
        (status === 'not-entered' || status === 'incomplete') ? (
          <AppText variant="small" style={styles.alignRight}>
            {status === 'not-entered' ? 'Not entered yet' : 'Some amounts missing'}
          </AppText>
        ) : null}
        <AllocationGuidance progress={progress} compact />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  alignRight: { textAlign: 'right' },
  row: { flexDirection: 'row', gap: spacing.medium, alignItems: 'flex-start' },
  cell: { flex: 1, minWidth: 0, gap: spacing.small },
});
