import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type ViewProps,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardDoneBar } from './KeyboardDoneBar';
import { BankHeader } from './BankHeader';
import { colors, spacing } from '../theme/theme';
export function Screen({
  children,
  contentStyle,
}: ViewProps & { contentStyle?: StyleProp<ViewStyle> }) {
  return (
    <View style={styles.root}>
      <BankHeader />
      <SafeAreaView edges={['left', 'right']} style={styles.root}>
        <KeyboardAvoidingView
          style={styles.root}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            automaticallyAdjustKeyboardInsets={false}
            contentContainerStyle={[styles.content, contentStyle]}
          >
            {children}
          </ScrollView>
          <KeyboardDoneBar />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: spacing.screen, gap: spacing.large, paddingBottom: 32, flexGrow: 1 },
});
