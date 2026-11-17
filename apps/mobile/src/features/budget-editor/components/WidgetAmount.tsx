import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../foundation/components/AppText';
import { TextField } from '../../../foundation/components/TextField';
import { formatDkk } from '../../budget-shared';
import { colors, fonts, spacing } from '../../../foundation/theme/theme';
import { isAmountInput, parseAmount, widgetTotal, type DraftWidget } from '../editor/draft';

export function WidgetAmount({
  widget,
  onOpen,
  onChange,
  onAmountBlur,
}: {
  widget: DraftWidget;
  onOpen: () => void;
  onChange: (widget: DraftWidget) => void;
  onAmountBlur: (rowId: string) => void;
}) {
  const name = widget.name || 'Unnamed widget';
  const fixed = widget.type === 'FIXED_EXPENSE';
  const row = widget.rows[0];
  const total = widgetTotal(widget);
  const numericTotal = total.endsWith(' kr.');
  const hasBillInput = fixed && widget.rows.some((item) => item.input.trim() !== '');
  return (
    <>
      {!fixed && row && widget.rows.length === 1 ? (
        <TextField
          containerStyle={styles.cell}
          appearance="bubble"
          style={[styles.mainInput, styles.alignRight]}
          label="DKK / month"
          hideLabel
          suffix={row.input.trim() ? 'kr.' : undefined}
          placeholder="Angiv beløb"
          placeholderTextColor={colors.muted}
          accessibilityHint="Monthly amount in DKK"
          accessibilityLabel={`${name} row 1 amount in DKK`}
          value={row.input}
          displayValue={
            parseAmount(row).amount !== undefined
              ? formatDkk(parseAmount(row).amount!).replace(/ kr\.$/, '')
              : row.input
          }
          keyboardType="decimal-pad"
          maxLength={24}
          error={parseAmount(row).error}
          onBlur={() => onAmountBlur(row.id)}
          onChangeText={(input) => {
            if (isAmountInput(input)) onChange({ ...widget, rows: [{ ...row, input }] });
          }}
        />
      ) : (
        <View style={styles.cell}>
          {fixed ? (
            <Pressable
              style={({ pressed }) => [
                styles.amountSurface,
                styles.actionSurface,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${hasBillInput ? 'Edit bills' : 'Add bills'} to ${name}`}
              accessibilityHint="Opens the bill list"
              accessibilityValue={{ text: hasBillInput ? total : 'No bill amounts entered' }}
              onPress={onOpen}
            >
              <AppText
                variant="heading"
                style={[styles.amountText, !hasBillInput && styles.actionText]}
                numberOfLines={hasBillInput && numericTotal ? 1 : undefined}
                adjustsFontSizeToFit={hasBillInput && numericTotal}
                minimumFontScale={0.7}
              >
                {hasBillInput && numericTotal ? (
                  <>
                    {total.slice(0, -4)}
                    <AppText style={styles.currency}> kr.</AppText>
                  </>
                ) : hasBillInput ? (
                  total
                ) : (
                  'Add bills'
                )}
              </AppText>
              <AppText variant="small" accessible={false} importantForAccessibility="no">
                ›
              </AppText>
            </Pressable>
          ) : (
            <View
              style={styles.amountSurface}
              accessible
              accessibilityLabel={`${name} monthly total: ${widgetTotal(widget)}`}
              accessibilityHint="Contains multiple preserved planning items."
            >
              <AppText variant="heading">{widgetTotal(widget)}</AppText>
            </View>
          )}
        </View>
      )}
    </>
  );
}
const styles = StyleSheet.create({
  alignRight: { textAlign: 'right' },
  actionSurface: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  currency: { fontSize: 14, fontWeight: '400' },
  actionText: { color: colors.blue },
  pressed: { opacity: 0.65 },
  amountText: {
    flex: 1,
    minWidth: 0,
    textAlign: 'right',
    fontSize: 18,
    lineHeight: 24,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  mainInput: {
    borderColor: colors.line,
    fontSize: 18,
    lineHeight: 24,
    fontFamily: fonts.semibold,
    minHeight: 44,
    paddingVertical: 8,
  },
  amountSurface: {
    minHeight: 44,
    paddingVertical: 8,

    flexDirection: 'row',
    gap: spacing.small,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  cell: { minWidth: 0, gap: spacing.small },
});
