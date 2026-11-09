import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from './AppText';
import { colors, spacing } from '../theme/theme';
export function BankHeader() {
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <View style={styles.row}>
        <AppText variant="heading" style={styles.text}>
          Danske Bank
        </AppText>
        <AppText variant="small" style={styles.text}>
          Demo
        </AppText>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { backgroundColor: colors.navy },
  row: {
    minHeight: 64,
    padding: spacing.large,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.large,
    flexWrap: 'wrap',
  },
  text: { color: colors.white },
});
