import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { AppText } from '../../../foundation/components/AppText';
import { colors, spacing } from '../../../foundation/theme/theme';
import { type DraftWidget } from '../editor/draft';
import { BudgetRowEditor } from './BudgetRowEditor';

export function BillList({
  widget,
  onChange,
  onAddRow,
}: {
  widget: DraftWidget;
  onChange: (widget: DraftWidget) => void;
  onAddRow: () => void;
}) {
  const { fontScale } = useWindowDimensions();
  const name = widget.name || 'Unnamed widget';
  return (
    <>
      <View style={styles.sectionHeading}>
        <AppText variant="heading" accessibilityRole="header">
          Bills
        </AppText>
        <AppText variant="small">
          {widget.rows.length} {widget.rows.length === 1 ? 'bill' : 'bills'}
        </AppText>
      </View>
      <View style={styles.billList}>
        {fontScale <= 1.3 && widget.rows.length > 0 ? (
          <View style={styles.columns}>
            <AppText variant="small" style={styles.column}>
              Bill name
            </AppText>
            <AppText variant="small" style={[styles.column, styles.right]}>
              DKK / payment
            </AppText>
            <View style={styles.removeSpace} />
          </View>
        ) : null}
        {widget.rows.length === 0 ? (
          <AppText>No bills yet. Add a bill to plan an amount.</AppText>
        ) : null}
        {widget.rows.map((row, index) => (
          <BudgetRowEditor
            key={row.id}
            row={row}
            prefix={`${name} row ${index + 1}`}
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
          onPress={onAddRow}
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
  billList: {
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: spacing.medium,
    paddingTop: spacing.medium,
  },
  columns: { flexDirection: 'row', gap: spacing.medium, paddingBottom: spacing.small },
  column: { flex: 1 },
  right: { textAlign: 'right' },
  removeSpace: { width: 44 },
  addBill: { minHeight: 52, justifyContent: 'center', borderTopWidth: 1, borderColor: colors.line },
});
