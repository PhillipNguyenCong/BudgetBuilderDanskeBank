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
  return (
    <>
      <View style={styles.frequencyRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${prefix} frequency: ${row.needsFrequencyReview ? 'Needs confirmation' : billFrequencyLabels[frequency]}`}
          accessibilityState={{ expanded: choosingFrequency }}
          style={({ pressed }) => [styles.frequencyButton, pressed && styles.pressed]}
          onPress={() => setChoosingFrequency(!choosingFrequency)}
        >
          <AppText variant="small" style={styles.action}>
            {row.needsFrequencyReview ? 'Confirm frequency' : billFrequencyLabels[frequency]} ▾
          </AppText>
        </Pressable>
        <AppText variant="small" style={styles.monthly}>
          {row.needsFrequencyReview
            ? 'Confirm frequency to calculate monthly amount'
            : parsed.amount !== undefined
              ? `${formatDkk(monthlyBillAllocation(parsed.amount, frequency))}/month`
              : row.input.trim()
                ? 'Check amount'
                : 'Amount not entered'}
        </AppText>
      </View>
      {choosingFrequency ? (
        <View style={styles.choices}>
          {BillFrequencySchema.options.map((choice) => (
            <Pressable
              key={choice}
              accessibilityRole="radio"
              accessibilityLabel={`${prefix}: ${billFrequencyLabels[choice]}`}
              accessibilityState={{ checked: !row.needsFrequencyReview && choice === frequency }}
              style={({ pressed }) => [styles.frequencyButton, pressed && styles.pressed]}
              onPress={() => {
                onChange({ ...row, frequency: choice, needsFrequencyReview: false });
                setChoosingFrequency(false);
              }}
            >
              <AppText variant="small" style={styles.action}>
                {!row.needsFrequencyReview && choice === frequency ? '✓ ' : ''}
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
  frequencyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.medium },
  frequencyButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.blue,
    backgroundColor: colors.tint,
  },
  action: { color: colors.blue, fontWeight: '600' },
  pressed: { opacity: 0.65 },
  monthly: { flex: 1, textAlign: 'right', marginRight: 44 + spacing.medium },
  choices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.medium,
    backgroundColor: colors.canvas,
    borderRadius: 8,
    padding: spacing.small,
  },
});
