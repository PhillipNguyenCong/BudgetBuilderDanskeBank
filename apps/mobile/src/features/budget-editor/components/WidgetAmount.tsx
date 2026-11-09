import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../foundation/components/AppText';
import { TextField } from '../../../foundation/components/TextField';
import { colors, fonts, spacing } from '../../../foundation/theme/theme';
import { isAmountInput, parseAmount, widgetTotal, type DraftWidget } from '../editor/draft';

export function WidgetAmount({
  widget,
  onOpen,
  onChange,
}: {
  widget: DraftWidget;
  onOpen: () => void;
  onChange: (widget: DraftWidget) => void;
}) {
  const name = widget.name || 'Unnamed widget';
  const fixed = widget.type === 'FIXED_EXPENSE';
  const row = widget.rows[0];
  const hasBillInput = fixed && widget.rows.some((item) => item.input.trim() !== '');
  return (
    <>
      {!fixed && row && widget.rows.length === 1 ? (
        <TextField
          containerStyle={styles.cell}
          appearance="underline"
          style={[styles.mainInput, styles.alignRight]}
          label="DKK / month"
          accessibilityLabel={`${name} row 1 amount in DKK`}
          value={row.input}
          keyboardType="decimal-pad"
          maxLength={24}
          error={parseAmount(row).error}
          onChangeText={(input) => {
            if (isAmountInput(input)) onChange({ ...widget, rows: [{ ...row, input }] });
          }}
        />
      ) : (
        <View style={styles.cell}>
          <AppText variant="small" style={styles.alignRight}>
            Total / month
          </AppText>
          {fixed ? (
            <Pressable
              style={styles.amountSurface}
              accessibilityRole="button"
              accessibilityLabel={`${hasBillInput ? 'Edit bills' : 'Add bills'} to ${name}`}
              accessibilityHint="Opens the bill list"
              onPress={onOpen}
            >
              <AppText variant="heading" style={styles.amountText}>
                {hasBillInput ? widgetTotal(widget) : 'Add bills'}
              </AppText>
              <AppText variant="small" accessible={false} importantForAccessibility="no">
                ›
              </AppText>
            </Pressable>
          ) : (
            <View style={styles.amountSurface}>
              <AppText variant="heading">{widgetTotal(widget)}</AppText>
            </View>
          )}
          {!fixed ? (
            <AppText variant="small">
              This draft contains multiple items; their amounts are preserved.
            </AppText>
          ) : null}
        </View>
      )}
    </>
  );
}
const styles = StyleSheet.create({
  alignRight: { textAlign: 'right' },
  amountText: { flexShrink: 1, textAlign: 'right' },
  mainInput: { fontSize: 20, lineHeight: 28, fontFamily: fonts.semibold, minHeight: 54 },
  amountSurface: {
    minHeight: 54,
    paddingVertical: spacing.medium,
    borderBottomWidth: 1,
    borderColor: colors.muted,
    flexDirection: 'row',
    gap: spacing.small,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  cell: { flex: 1, minWidth: 0, gap: spacing.small },
});
