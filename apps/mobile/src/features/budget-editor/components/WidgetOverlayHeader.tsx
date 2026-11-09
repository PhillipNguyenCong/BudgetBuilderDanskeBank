import { type ComponentRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../foundation/components/AppText';
import { colors, spacing } from '../../../foundation/theme/theme';

export function WidgetOverlayHeader({
  name,
  heading,
  onClose,
}: {
  name: string;
  heading: React.RefObject<ComponentRef<typeof View> | null>;
  onClose: () => void;
}) {
  return (
    <View style={styles.header}>
      <View
        ref={heading}
        accessible
        accessibilityRole="header"
        accessibilityLabel={name}
        style={styles.title}
      >
        <AppText variant="heading">{name}</AppText>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close"
        onPress={onClose}
        style={styles.close}
      >
        <AppText variant="heading">×</AppText>
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.large,
    gap: spacing.medium,
  },
  close: {
    width: 44,
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1, gap: spacing.small },
});
