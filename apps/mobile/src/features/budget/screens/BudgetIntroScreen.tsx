import { StyleSheet } from 'react-native';
import { Screen } from '../../../foundation/components/Screen';
import { AppText } from '../../../foundation/components/AppText';
import { Card } from '../../../foundation/components/Card';
import { Button } from '../../../foundation/components/Button';
import { colors } from '../../../foundation/theme/theme';
export function BudgetIntroScreen() {
  return (
    <Screen>
      <AppText variant="heading" accessibilityRole="header">
        Your money, organised
      </AppText>
      <AppText variant="title">A simple plan for your monthly salary.</AppText>
      {[
        ['Spending', 'Know what you can spend'],
        ['Savings', 'Build up money over time'],
        ['Fixed expenses', 'Keep money ready for bills'],
      ].map(([name, description]) => (
        <Card key={name} style={styles.card}>
          <AppText variant="small" style={styles.muted}>
            {name}
          </AppText>
          <AppText variant="label">{description}</AppText>
        </Card>
      ))}
      <AppText>Pots divide the money in your account. No bank transfer is made.</AppText>
      <Button
        label="Create budget"
        disabled
        accessibilityHint="Budget creation is not available in this demo yet."
      />
      <AppText variant="small" style={styles.muted}>
        Budget creation is not available in this demo yet.
      </AppText>
    </Screen>
  );
}
const styles = StyleSheet.create({ card: { minHeight: 90 }, muted: { color: colors.muted } });
