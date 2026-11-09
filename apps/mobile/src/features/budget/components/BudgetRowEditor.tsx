import { useState } from 'react';
import { BillFrequencySchema } from '@budget-builder/contracts';
import { monthlyBillAllocation } from '@budget-builder/budget-core/allocations';
import { billFrequencyLabels } from '../editor/billFrequency';
import { View, StyleSheet, useWindowDimensions, Pressable } from 'react-native';
import { AppText } from '../../../foundation/components/AppText';
import { TextField } from '../../../foundation/components/TextField';
import { spacing, colors } from '../../../foundation/theme/theme';
import { isAdjusted, parseAmount, formatDkk, type DraftRow } from '../editor/draft';

export function BudgetRowEditor({
  row,
  prefix,
  onChange,
  onRemove,
}: {
  row: DraftRow;
  prefix: string;
  onChange: (row: DraftRow) => void;
  onRemove: () => void;
}) {
  const [choosingFrequency, setChoosingFrequency] = useState(false);
  const frequency = row.frequency ?? 'MONTHLY';
  const parsed = parseAmount(row);
  const { fontScale } = useWindowDimensions();
  const stacked = fontScale > 1.3;
  return (
    <View style={styles.row}>
      <View style={[styles.fields, stacked && styles.stacked]}>
        <TextField
          label="Bill"
          placeholder="Bill name"
          hideLabel={!stacked}
          appearance="underline"
          containerStyle={!stacked && styles.field}
          accessibilityLabel={`${prefix} label`}
          value={row.label}
          onChangeText={(label) => onChange({ ...row, label })}
          maxLength={100}
          error={!row.label.trim() ? 'Enter an item name.' : undefined}
        />
        <TextField
          label="DKK / payment"
          placeholder="0"
          hideLabel={!stacked}
          appearance="underline"
          style={styles.amount}
          containerStyle={!stacked && styles.field}
          accessibilityLabel={`${prefix} amount in DKK`}
          value={row.input}
          onChangeText={(input) => onChange({ ...row, input })}
          keyboardType="number-pad"
          maxLength={24}
          error={parseAmount(row).error}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remove ${prefix}`}
          onPress={onRemove}
          style={styles.remove}
        >
          <AppText variant="heading">×</AppText>
        </Pressable>
      </View>
      <View style={styles.frequencyRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${prefix} frequency: ${billFrequencyLabels[frequency]}`}
          accessibilityState={{ expanded: choosingFrequency }}
          style={styles.frequencyButton}
          onPress={() => setChoosingFrequency(!choosingFrequency)}
        >
          <AppText variant="small">{billFrequencyLabels[frequency]} ▾</AppText>
        </Pressable>
        <AppText variant="small" style={styles.monthly}>
          {parsed.amount !== undefined
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
              accessibilityState={{ checked: choice === frequency }}
              style={styles.frequencyButton}
              onPress={() => {
                onChange({ ...row, frequency: choice });
                setChoosingFrequency(false);
              }}
            >
              <AppText variant="small">
                {choice === frequency ? '✓ ' : ''}
                {billFrequencyLabels[choice]}
              </AppText>
            </Pressable>
          ))}
        </View>
      ) : null}
      {row.source?.kind === 'SUGGESTED' && isAdjusted(row) ? (
        <AppText variant="small">Adjusted by you</AppText>
      ) : null}
      {row.source ? (
        <View style={styles.evidence}>
          <AppText variant="small">{row.source.explanation}</AppText>
          {row.source.period ? (
            <AppText variant="small">
              Source period: {row.source.period.from} – {row.source.period.to}
            </AppText>
          ) : null}
          {row.source.kind === 'SUGGESTED' ? (
            <AppText variant="small">
              Original suggestion: {row.original.label}, {formatDkk(row.original.amountOere)}
            </AppText>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  row: {
    gap: spacing.small,
    borderTopWidth: 1,
    borderColor: colors.line,
    paddingVertical: spacing.small,
  },
  fields: { flexDirection: 'row', gap: spacing.medium, alignItems: 'flex-start' },
  amount: { textAlign: 'right' },
  stacked: { flexDirection: 'column', alignItems: 'stretch' },
  field: { flexGrow: 1, flexBasis: 0, minWidth: 0 },
  remove: {
    minWidth: 44,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  frequencyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.medium },
  frequencyButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.small },
  monthly: { flex: 1, textAlign: 'right', marginRight: 44 + spacing.medium },
  choices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.medium,
    backgroundColor: colors.canvas,
    borderRadius: 8,
    padding: spacing.small,
  },
  evidence: { gap: spacing.small },
});
