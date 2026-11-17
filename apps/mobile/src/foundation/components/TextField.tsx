import {
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
  type ComponentRef,
} from 'react';
import {
  TextInput,
  useWindowDimensions,
  View,
  StyleSheet,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useKeyboardField } from './KeyboardFieldEditor';
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
  keyboardDone = false,
  onFocus,
  onBlur,
  ...props
}: TextInputProps & {
  ref?: Ref<ComponentRef<typeof TextInput>>;
  label: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  appearance?: 'outlined' | 'underline' | 'bubble' | 'quiet';
  hideLabel?: boolean;
  suffix?: string;
  displayValue?: string;
  keyboardDone?: boolean;
}) {
  const source = useRef<ComponentRef<typeof TextInput>>(null);
  useImperativeHandle(ref, () => source.current!, []);
  const controller = useKeyboardField();
  const id = useId();
  const blurEvent = useRef<Parameters<NonNullable<TextInputProps['onBlur']>>[0] | undefined>(
    undefined,
  );
  const [focused, setFocused] = useState(false);
  const { fontScale } = useWindowDimensions();
  const session = {
    id,
    source,
    label: props.accessibilityLabel ?? label,
    value: props.value ?? '',
    suffix,
    error,
    input: {
      keyboardType: props.keyboardType,
      maxLength: props.maxLength,
      placeholder: props.placeholder,
      autoCapitalize: props.autoCapitalize,
      autoCorrect: props.autoCorrect,
      secureTextEntry: props.secureTextEntry,
    },
    onChangeText: (text: string) => props.onChangeText?.(text),
    onFinish: () => {
      setFocused(false);
      if (blurEvent.current) onBlur?.(blurEvent.current);
    },
  };
  useEffect(() => {
    if (keyboardDone && controller?.owns(id)) controller.update(session);
  }, [props.value, props.onChangeText, onBlur, error, suffix, keyboardDone]);
  const cancel = controller?.cancel;
  useEffect(() => () => cancel?.(id), [cancel, id]);
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
          key={
            keyboardDone && controller
              ? 'keyboard-bubble-source'
              : keyboardDone
                ? 'with-keyboard-confirmation'
                : 'standard'
          }
          inputAccessoryViewID={
            keyboardDone && controller ? `keyboard-source-${id}` : props.inputAccessoryViewID
          }
          inputAccessoryViewButtonLabel={
            keyboardDone && !controller ? 'OK' : props.inputAccessoryViewButtonLabel
          }
          returnKeyType={
            keyboardDone && controller ? 'default' : keyboardDone ? 'done' : props.returnKeyType
          }
          submitBehavior={keyboardDone ? 'blurAndSubmit' : props.submitBehavior}
          value={!focused && displayValue !== undefined ? displayValue : props.value}
          onChangeText={(text) => {
            setFocused(true);
            props.onChangeText?.(text);
          }}
          ref={source}
          accessibilityLabel={props.accessibilityLabel ?? label}
          accessibilityHint={error ?? props.accessibilityHint}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
            if (keyboardDone && controller && props.editable !== false && !props.readOnly)
              controller.begin(session);
          }}
          onBlur={(event) => {
            blurEvent.current = event;
            if (keyboardDone && controller?.owns(id)) return;
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
            appearance === 'quiet' && styles.quiet,
            appearance === 'quiet' && focused && styles.activeQuiet,
            appearance === 'quiet' && error && styles.invalid,
            suffix && { paddingRight: Math.ceil(30 * fontScale) + 12 },
            style,
            focused && appearance !== 'underline' && styles.focused,
            focused && appearance === 'underline' && styles.activeUnderline,
            error && styles.invalid,
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
  quiet: { backgroundColor: 'transparent', borderColor: 'transparent' },
  activeQuiet: { borderColor: colors.muted },
  focused: { borderWidth: 2, borderColor: colors.blue, backgroundColor: colors.tint },
  activeBubble: { borderWidth: 2 },
  activeUnderline: { borderBottomWidth: 2, borderBottomColor: colors.ink },
  invalid: { borderColor: colors.ink, borderWidth: 2 },
});
