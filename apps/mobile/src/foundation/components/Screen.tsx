import { ScrollView, StyleSheet, View, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BankHeader } from './BankHeader';
import { colors, spacing } from '../theme/theme';
export function Screen({ children }: ViewProps) {
  return (
    <View style={styles.root}>
      <BankHeader />
      <SafeAreaView edges={['left', 'right']} style={styles.root}>
        <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView>
      </SafeAreaView>
    </View>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: spacing.screen, gap: spacing.medium, flexGrow: 1 },
});
