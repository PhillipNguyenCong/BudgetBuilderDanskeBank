import { Pressable, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { colors, spacing } from '../theme/theme';
type Props = {
  label: string;
  disabled?: boolean;
  onPress?: () => void;
  accessibilityHint?: string;
  variant?: 'primary' | 'secondary';
};
export function Button({
  label,
  disabled = false,
  onPress,
  accessibilityHint,
  variant = 'primary',
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      accessibilityHint={accessibilityHint}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' && styles.secondary,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <AppText
        variant="label"
        style={[
          styles.label,
          variant === 'secondary' && styles.secondaryLabel,
          disabled && styles.disabledLabel,
        ]}
      >
        {label}
      </AppText>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    minWidth: 44,
    borderRadius: 8,
    backgroundColor: colors.blue,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.medium,
  },
  disabled: { backgroundColor: colors.disabled },
  pressed: { opacity: 0.8 },
  label: { color: colors.white, textAlign: 'center' },
  disabledLabel: { color: colors.muted },
  secondary: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  secondaryLabel: { color: colors.blue },
});
