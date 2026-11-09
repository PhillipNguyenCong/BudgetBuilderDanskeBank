import { useState, type Ref, type ComponentRef } from 'react';
import {
  TextInput,
  View,
  StyleSheet,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { AppText } from './AppText';
import { colors, fonts, spacing } from '../theme/theme';

export function TextField({
  ref,
  label,
  error,
  style,
  containerStyle,
  appearance = 'outlined',
  hideLabel = false,
  onFocus,
  onBlur,
  ...props
}: TextInputProps & {
  ref?: Ref<ComponentRef<typeof TextInput>>;
  label: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  appearance?: 'outlined' | 'underline';
  hideLabel?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.field, containerStyle]}>
      {!hideLabel ? <AppText variant="small">{label}</AppText> : null}
      <TextInput
        {...props}
        ref={ref}
        accessibilityLabel={props.accessibilityLabel ?? label}
        accessibilityHint={error ?? props.accessibilityHint}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        style={[
          styles.input,
          error && styles.invalid,
          appearance === 'underline' && styles.underline,
          appearance === 'underline' && (focused || !!error) && styles.activeUnderline,
          style,
        ]}
      />
      {error ? (
        <AppText variant="small" accessibilityRole="alert">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  field: { gap: spacing.small },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    padding: spacing.medium,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.ink,
    backgroundColor: colors.white,
  },
  underline: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.muted,
    borderRadius: 0,
    paddingHorizontal: 0,
  },
  activeUnderline: { borderBottomWidth: 2, borderBottomColor: colors.ink },
  invalid: { borderColor: colors.ink, borderWidth: 2 },
});
