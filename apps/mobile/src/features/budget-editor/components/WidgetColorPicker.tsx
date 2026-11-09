import { ColorSchema } from '@budget-builder/contracts';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../foundation/components/AppText';
import { colors, spacing } from '../../../foundation/theme/theme';
import { widgetPalette } from '../../budget-shared';
import { type DraftWidget } from '../editor/draft';

export function WidgetColorPicker({
  widget,
  onChange,
}: {
  widget: DraftWidget;
  onChange: (widget: DraftWidget) => void;
}) {
  const name = widget.name || 'Unnamed widget';
  return (
    <View style={styles.settings}>
      <AppText variant="small">Pot colour</AppText>
      <View style={styles.palette}>
        {ColorSchema.options.map((color) => (
          <Pressable
            key={color}
            accessibilityRole="radio"
            accessibilityLabel={`${name} color ${widgetPalette[color].name}`}
            accessibilityState={{ checked: widget.color === color }}
            onPress={() => onChange({ ...widget, color })}
            style={[
              styles.color,
              { backgroundColor: widgetPalette[color].background },
              widget.color === color && styles.selected,
            ]}
          >
            <AppText variant="small">
              {widget.color === color ? '✓ ' : ''}
              {widgetPalette[color].name}
            </AppText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  settings: {
    gap: spacing.medium,
    paddingTop: spacing.large,
    borderTopWidth: 1,
    borderColor: colors.line,
  },
  palette: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.small },
  color: {
    minHeight: 44,
    minWidth: 80,
    padding: spacing.medium,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 8,
    justifyContent: 'center',
  },
  selected: { borderColor: colors.ink },
});
