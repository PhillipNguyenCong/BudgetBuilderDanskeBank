import { Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../theme/theme';

export function BackButton({
  onPress,
  disabled = false,
}: {
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessible
      accessibilityRole="button"
      accessibilityLabel="Back"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <View accessible={false} importantForAccessibility="no-hide-descendants" style={styles.icon}>
        <View style={styles.arrowhead} />
        <View style={styles.shaft} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: colors.white,
  },
  pressed: { backgroundColor: colors.disabled },
  disabled: { opacity: 0.4 },
  icon: { width: 24, height: 24 },
  arrowhead: {
    position: 'absolute',
    width: 12,
    height: 12,
    left: 4,
    top: 6,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.blue,
    transform: [{ rotate: '45deg' }],
  },
  shaft: {
    position: 'absolute',
    width: 20,
    height: 2,
    left: 2,
    top: 11,
    backgroundColor: colors.blue,
  },
});
