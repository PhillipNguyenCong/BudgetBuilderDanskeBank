import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../foundation/components/AppText';
import { spacing } from '../../../foundation/theme/theme';
import { typeLabels } from '../../budget-shared';
import { type DraftWidget } from '../editor/draft';

export function WidgetHeader({
  widget,
  overlayLabel,
  onOpen,
}: {
  widget: DraftWidget;
  overlayLabel: string;
  onOpen: () => void;
}) {
  const name = widget.name || 'Unnamed widget';
  return (
    <View style={[styles.row, styles.topRow]}>
      <View style={styles.cell}>
        <AppText variant="small">{typeLabels[widget.type]}</AppText>
      </View>
      <Pressable
        style={[styles.cell, styles.button]}
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={`${overlayLabel} for ${name}`}
      >
        <AppText variant="small">{overlayLabel}</AppText>
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.medium, alignItems: 'flex-start' },
  topRow: { alignItems: 'center' },
  cell: { flex: 1, minWidth: 0, gap: spacing.small },
  button: { minHeight: 44, justifyContent: 'center', alignItems: 'flex-end' },
});
