import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../foundation/components/AppText';
import { colors, spacing } from '../../../foundation/theme/theme';
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
        <AppText variant="label">{typeLabels[widget.type]}</AppText>
      </View>
      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={`${overlayLabel} for ${name}`}
      >
        <AppText variant="label" style={styles.action}>
          {overlayLabel}
        </AppText>
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.medium, alignItems: 'flex-start' },
  topRow: { alignItems: 'center' },
  cell: { flex: 1, minWidth: 0, gap: spacing.small },
  button: {
    minHeight: 44,
    flexShrink: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.blue,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  action: { color: colors.blue },
  pressed: { opacity: 0.65 },
});
