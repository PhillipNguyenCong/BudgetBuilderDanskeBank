import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../foundation/components/AppText';
import { colors, spacing } from '../../../foundation/theme/theme';
import { type DraftWidget } from '../editor/draft';
import type { BillFocus } from '../hooks/useBillFocus';
import { BudgetRowEditor } from './BudgetRowEditor';

export function BillList({
  widget,
  onChange,
  onAddRow,
  focus,
  onAmountBlur,
}: {
  widget: DraftWidget;
  onChange: (widget: DraftWidget) => void;
  onAddRow: () => void;
  focus: BillFocus;
  onAmountBlur: (rowId: string) => void;
}) {
  const name = widget.name || 'Unnamed widget';
  return (
    <>
      <View style={styles.sectionHeading}>
        <AppText variant="label" accessibilityRole="header">
          Bills
        </AppText>
        <AppText variant="small">
          {widget.rows.length} {widget.rows.length === 1 ? 'bill' : 'bills'}
        </AppText>
      </View>
      <View style={styles.billList}>
        {widget.rows.length === 0 ? (
          <AppText>No bills yet. Add a bill to plan an amount.</AppText>
        ) : null}
        {widget.rows.map((row, index) => (
          <BudgetRowEditor
            key={row.id}
            row={row}
            focus={focus}
            prefix={`${name} row ${index + 1}`}
            onAmountBlur={onAmountBlur}
            onChange={(value) =>
              onChange({
                ...widget,
                rows: widget.rows.map((item) => (item.id === row.id ? value : item)),
              })
            }
            onRemove={() =>
              onChange({
                ...widget,
                rows: widget.rows.filter((item) => item.id !== row.id),
              })
            }
          />
        ))}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Add bill to ${name}`}
          accessibilityState={{ disabled: widget.rows.length >= 1000 }}
          disabled={widget.rows.length >= 1000}
          onPress={() => focus.add(onAddRow)}
          style={styles.addBill}
        >
          <AppText variant="label">＋ Add bill</AppText>
        </Pressable>
      </View>
    </>
  );
}
const styles = StyleSheet.create({
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.medium,
  },
  billList: { gap: 10 },
  addBill: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    backgroundColor: colors.white,
  },
});
