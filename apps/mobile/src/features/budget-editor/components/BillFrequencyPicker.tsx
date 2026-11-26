import { monthlyBillAllocation } from '@budget-builder/budget-core/allocations';
import { BillFrequencySchema } from '@budget-builder/contracts';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../foundation/components/AppText';
import { colors, spacing } from '../../../foundation/theme/theme';
import { billFrequencyLabels, formatDkk } from '../../budget-shared';
import { parseAmount, type DraftRow } from '../editor/draft';

export function BillFrequencyPicker({
  row,
  prefix,
  onChange,
}: {
  row: DraftRow;
  prefix: string;
  onChange: (row: DraftRow) => void;
}) {
  const [choosingFrequency, setChoosingFrequency] = useState(false);
  const frequency = row.frequency ?? 'MONTHLY';
  const parsed = parseAmount(row);
  if (row.carExpense?.basis === 'MONTHLY_RESERVE')
    return <AppText variant="small">Monthly reserve · not a monthly bill</AppText>;
  return (
    <>
      <View style={styles.frequencyRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${prefix} frequency: ${billFrequencyLabels[frequency]}`}
          accessibilityState={{ expanded: choosingFrequency }}
          style={({ pressed }) => [styles.frequencyButton, pressed && styles.pressed]}
          onPress={() => setChoosingFrequency(!choosingFrequency)}
        >
          <AppText variant="small" style={styles.action}>
            {billFrequencyLabels[frequency]} ▾
          </AppText>
        </Pressable>
        {frequency !== 'MONTHLY' || (row.input.trim() && parsed.error) ? (
          <AppText variant="small" style={styles.monthly}>
            {parsed.amount !== undefined
              ? `${formatDkk(monthlyBillAllocation(parsed.amount, frequency))}/month`
              : row.input.trim()
                ? 'Check amount'
                : 'Amount not entered'}
          </AppText>
        ) : null}
      </View>
      {choosingFrequency ? (
        <View style={styles.choices}>
          {BillFrequencySchema.options.map((choice) => (
            <Pressable
              key={choice}
              accessibilityRole="radio"
              accessibilityLabel={`${prefix}: ${billFrequencyLabels[choice]}`}
              accessibilityState={{ checked: choice === frequency }}
              style={({ pressed }) => [styles.frequencyButton, pressed && styles.pressed]}
              onPress={() => {
                onChange({ ...row, frequency: choice });
                setChoosingFrequency(false);
              }}
            >
              <AppText variant="small" style={styles.action}>
                {choice === frequency ? '✓ ' : ''}
                {billFrequencyLabels[choice]}
              </AppText>
            </Pressable>
          ))}
        </View>
      ) : null}
    </>
  );
}
const styles = StyleSheet.create({
  frequencyRow: { flexWrap: 'wrap', flexDirection: 'row', alignItems: 'center', gap: 4 },
  frequencyButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  action: { color: colors.blue, fontWeight: '600' },
  pressed: { opacity: 0.65 },
  monthly: { flex: 1, textAlign: 'right', minWidth: 85 },
  choices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.medium,
    backgroundColor: colors.canvas,
    borderRadius: 8,
    padding: spacing.small,
  },
});
