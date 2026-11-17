import { useEffect, useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useKeyboardField } from './KeyboardFieldEditor';
import { AppText } from './AppText';
import { colors } from '../theme/theme';

/** Place after scroll content inside a KeyboardAvoidingView. */
export function KeyboardDoneBar() {
  const editor = useKeyboardField();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (Platform.OS === 'ios') return;
    const show = Keyboard.addListener('keyboardDidShow', () => setVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  if (Platform.OS === 'ios' || (!visible && !editor?.active)) return null;
  if (editor?.active) return null;
  return (
    <View style={styles.bar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="OK"
        accessibilityHint="Finishes editing and dismisses the keyboard"
        onPress={Keyboard.dismiss}
        style={({ pressed }) => [styles.button, pressed && { opacity: 0.65 }]}
      >
        <AppText variant="label" style={styles.label}>
          OK
        </AppText>
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 16,
    alignItems: 'flex-end',
  },
  button: { minHeight: 44, minWidth: 64, alignItems: 'center', justifyContent: 'center' },
  label: { color: colors.blue },
});
