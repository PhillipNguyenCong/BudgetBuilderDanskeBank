import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from './AppText';
import { colors, spacing } from '../theme/theme';
export function BankHeader() {
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <View style={styles.row}>
        <AppText variant="heading" maxFontSizeMultiplier={1.5} style={styles.text}>
          Danske Bank
        </AppText>
        <AppText variant="small" maxFontSizeMultiplier={1.5} style={styles.badge}>
          Demo
        </AppText>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { backgroundColor: colors.canvas },
  row: {
    minHeight: 40,
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing.small,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.large,
    flexWrap: 'wrap',
  },
  text: { color: colors.navy, fontSize: 17, letterSpacing: -0.3 },
  badge: {
    color: colors.muted,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    overflow: 'hidden',
  },
});
