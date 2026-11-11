import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../foundation/components/AppText';
import { Button } from '../../../foundation/components/Button';
import { Card } from '../../../foundation/components/Card';
import { Screen } from '../../../foundation/components/Screen';
import { colors } from '../../../foundation/theme/theme';
export function BudgetIntroScreen({
  onCreate,
  onPreview,
}: {
  onCreate: () => void;
  onPreview?: () => void;
}) {
  return (
    <Screen>
      <AppText variant="title" accessibilityRole="header">
        Your money, organised
      </AppText>
      <AppText style={styles.subtitle}>A simple plan for your monthly salary.</AppText>
      <View style={styles.tiles}>
        <Card style={styles.spending}>
          <AppText variant="heading">Spending</AppText>
          <AppText style={styles.hero}>Make room for everyday life.</AppText>
          <AppText>Know what you can spend</AppText>
        </Card>
        <View style={styles.pair}>
          <Card style={[styles.smallTile, styles.savings]}>
            <AppText variant="heading">Savings</AppText>
            <AppText>Build up money over time</AppText>
          </Card>
          <Card style={[styles.smallTile, styles.bills]}>
            <AppText variant="heading">Fixed expenses</AppText>
            <AppText>Keep money ready for bills</AppText>
          </Card>
        </View>
      </View>
      <AppText>Pots divide the money in your account. No bank transfer is made.</AppText>
      <Button label="Create budget" onPress={onCreate} />
      {onPreview ? (
        <Button label="Preview sample widgets" variant="secondary" onPress={onPreview} />
      ) : null}
    </Screen>
  );
}
const styles = StyleSheet.create({
  subtitle: { color: colors.muted, fontSize: 18, lineHeight: 26 },
  tiles: { gap: 12, marginVertical: 12 },
  spending: {
    backgroundColor: '#E4EDFF',
    gap: 16,
    minHeight: 200,
    justifyContent: 'space-between',
  },
  hero: { fontSize: 30, lineHeight: 36, fontWeight: '600', letterSpacing: -0.6, maxWidth: 270 },
  pair: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  smallTile: {
    flexGrow: 1,
    flexBasis: 140,
    minHeight: 160,
    padding: 20,
    justifyContent: 'space-between',
  },
  savings: { backgroundColor: '#EAE4FA' },
  bills: { backgroundColor: '#DFF2E6' },
});
