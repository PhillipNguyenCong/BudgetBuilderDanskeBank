import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { AppText } from '../../../foundation/components/AppText';
import { TextField } from '../../../foundation/components/TextField';
import { colors, spacing } from '../../../foundation/theme/theme';
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
          appearance="underline"
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
          returnKeyType="done"
          submitBehavior="submit"
          onSubmitEditing={focus.dismiss}
          label="DKK / payment"
          placeholder="0"
          hideLabel={!stacked}
          appearance="underline"
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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remove ${prefix}`}
          onPress={onRemove}
          style={styles.remove}
        >
          <AppText variant="heading">×</AppText>
        </Pressable>
      </View>
      <BillFrequencyPicker row={row} prefix={prefix} onChange={onChange} />
      <RowSourceDetails row={row} />
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
});
