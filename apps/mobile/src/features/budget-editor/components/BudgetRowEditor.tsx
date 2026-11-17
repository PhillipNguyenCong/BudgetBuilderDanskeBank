import { useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { AppText } from '../../../foundation/components/AppText';
import { TextField } from '../../../foundation/components/TextField';
import { colors } from '../../../foundation/theme/theme';
import { formatDkk } from '../../budget-shared';
import { isAmountInput, parseAmount, type DraftRow } from '../editor/draft';
import type { BillFocus } from '../hooks/useBillFocus';
import { BillFrequencyPicker } from './BillFrequencyPicker';
import { RowSourceDetails } from './RowSourceDetails';

export function BudgetRowEditor({
  row,
  prefix,
  onChange,
  onRemove,
  focus,
  onAmountBlur,
}: {
  row: DraftRow;
  prefix: string;
  onChange: (row: DraftRow) => void;
  onRemove: () => void;
  focus: BillFocus;
  onAmountBlur: (rowId: string) => void;
}) {
  const { fontScale } = useWindowDimensions();
  const stacked = fontScale > 1.3;
  const [sourceOpen, setSourceOpen] = useState(false);
  return (
    <View style={styles.row}>
      <View style={[styles.fields, stacked && styles.stacked]}>
        <TextField
          ref={(input) => focus.register(row.id, 'name', input)}
          onFocus={() => focus.onFocus(row.id, 'name')}
          onBlur={() => focus.onBlur(row.id, 'name')}
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => focus.focus(row.id, 'amount')}
          label="Bill"
          placeholder="Bill name"
          hideLabel={!stacked}
          appearance="quiet"
          style={styles.name}
          containerStyle={!stacked && styles.field}
          accessibilityLabel={`${prefix} label`}
          value={row.label}
          onChangeText={(label) => onChange({ ...row, label })}
          maxLength={100}
          error={!row.label.trim() ? 'Enter an item name.' : undefined}
        />
        <TextField
          ref={(input) => focus.register(row.id, 'amount', input)}
          onFocus={() => focus.onFocus(row.id, 'amount')}
          onBlur={() => {
            onAmountBlur(row.id);
            focus.onBlur(row.id, 'amount');
          }}
          returnKeyType="default"
          submitBehavior="submit"
          onSubmitEditing={focus.dismiss}
          label="DKK / payment"
          placeholder="Amount"
          suffix={row.input.trim() ? 'kr.' : undefined}
          displayValue={
            parseAmount(row).amount !== undefined
              ? formatDkk(parseAmount(row).amount!).replace(/ kr\.$/, '')
              : row.input
          }
          hideLabel={!stacked}
          appearance="bubble"
          style={styles.amount}
          containerStyle={!stacked && styles.field}
          accessibilityLabel={`${prefix} amount in DKK`}
          value={row.input}
          onChangeText={(input) => {
            if (isAmountInput(input)) onChange({ ...row, input });
          }}
          keyboardType="decimal-pad"
          maxLength={24}
          error={parseAmount(row).error}
        />
      </View>
      <View style={styles.actions}>
        <View style={styles.frequency}>
          <BillFrequencyPicker row={row} prefix={prefix} onChange={onChange} />
        </View>
        {row.source ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Source details"
            accessibilityState={{ expanded: sourceOpen }}
            onPress={() => setSourceOpen(!sourceOpen)}
            style={styles.action}
          >
            <AppText variant="small" style={styles.link}>
              Details
            </AppText>
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remove ${prefix}`}
          onPress={onRemove}
          style={styles.action}
        >
          <AppText variant="small" style={styles.muted}>
            Remove
          </AppText>
        </Pressable>
      </View>
      {sourceOpen ? <RowSourceDetails row={row} /> : null}
    </View>
  );
}
const styles = StyleSheet.create({
  row: {
    gap: 4,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 4,
  },
  fields: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  amount: {
    textAlign: 'right',
    fontSize: 16,
    lineHeight: 22,
    minHeight: 44,
    paddingVertical: 8,
    borderColor: colors.line,
  },
  name: {
    fontSize: 16,
    lineHeight: 22,
    minHeight: 44,
    paddingVertical: 8,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
  },
  stacked: { flexDirection: 'column', alignItems: 'stretch' },
  field: { flex: 1, minWidth: 0 },
  actions: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' },
  frequency: { flex: 1, minWidth: 90 },
  action: { minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
  link: { color: colors.blue },
  muted: { color: colors.muted },
});
