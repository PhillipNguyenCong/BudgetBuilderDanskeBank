import { useState, type Ref, type ComponentRef } from 'react';
import {
  TextInput,
  useWindowDimensions,
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
  suffix,
  displayValue,
  onFocus,
  onBlur,
  ...props
}: TextInputProps & {
  ref?: Ref<ComponentRef<typeof TextInput>>;
  label: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  appearance?: 'outlined' | 'underline' | 'bubble';
  hideLabel?: boolean;
  suffix?: string;
  displayValue?: string;
}) {
  const [focused, setFocused] = useState(false);
  const { fontScale } = useWindowDimensions();
  return (
    <View style={[styles.field, containerStyle]}>
      {!hideLabel ? (
        <AppText variant="small" style={styles.label}>
          {label}
        </AppText>
      ) : null}
      <View style={suffix ? styles.inputRow : undefined}>
        <TextInput
          {...props}
          value={!focused && displayValue !== undefined ? displayValue : props.value}
          onChangeText={(text) => {
            setFocused(true);
            props.onChangeText?.(text);
          }}
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
            appearance === 'bubble' && styles.bubble,
            appearance === 'bubble' && focused && styles.activeBubble,
            appearance === 'bubble' && error && styles.invalid,
            suffix && { paddingRight: Math.ceil(30 * fontScale) + 12 },
            style,
          ]}
        />
        {suffix ? (
          <View pointerEvents="none" style={styles.suffix}>
            <AppText variant="small" accessible={false}>
              {suffix}
            </AppText>
          </View>
        ) : null}
      </View>
      {error ? (
        <AppText variant="small" accessibilityRole="alert">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  inputRow: { position: 'relative' },
  suffix: {
    position: 'absolute',
    right: 10,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  field: { gap: spacing.small },
  label: { fontWeight: '600' },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    padding: spacing.medium,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fonts.regular,
    color: colors.ink,
    backgroundColor: colors.white,
  },
  underline: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.ink,
    borderRadius: 0,
    paddingHorizontal: 0,
  },
  bubble: {
    minHeight: 54,
    borderColor: colors.blue,
    borderRadius: 14,
    paddingHorizontal: 12,
    backgroundColor: colors.white,
  },
  activeBubble: { borderWidth: 2 },
  activeUnderline: { borderBottomWidth: 2, borderBottomColor: colors.ink },
  invalid: { borderColor: colors.ink, borderWidth: 2 },
});
