import { Pressable, View, StyleSheet } from 'react-native';
import type { AllocationProgress } from '@budget-builder/budget-core/allocations';
import { AppText } from '../../../foundation/components/AppText';
import { Card } from '../../../foundation/components/Card';
import { TextField } from '../../../foundation/components/TextField';
import { colors, fonts, spacing } from '../../../foundation/theme/theme';
import { widgetTotal, parseAmount, type DraftWidget } from '../editor/draft';
import { AllocationGuidance } from './AllocationGuidance';

export const typeLabels = {
  INCOME: 'Income',
  SPENDING: 'Spending',
  FIXED_EXPENSE: 'Fixed expenses',
  SAVINGS: 'Savings',
};
export const widgetPalette = {
  OCEAN: { name: 'Ocean', background: '#dceaf0' },
  SKY: { name: 'Sky', background: '#e5f2fb' },
  MINT: { name: 'Mint', background: '#e2f3e9' },
  LAVENDER: { name: 'Lavender', background: '#eee8f5' },
  SAND: { name: 'Sand', background: '#f4eedc' },
  ROSE: { name: 'Rose', background: '#f8e7ea' },
};
export function BudgetWidget({
  widget,
  onOpen,
  onChange,
  progress,
}: {
  widget: DraftWidget;
  onOpen: () => void;
  onChange: (widget: DraftWidget) => void;
  progress: AllocationProgress;
}) {
  const name = widget.name || 'Unnamed widget';
  const fixed = widget.type === 'FIXED_EXPENSE';
  const row = widget.rows[0];
  const hasBillInput = fixed && widget.rows.some((item) => item.input.trim() !== '');
  const overlayLabel = hasBillInput ? 'Edit bills' : 'Settings';
  const status = progress.pots.find((pot) => pot.id === widget.id)?.status;
  return (
    <Card style={[styles.card, { backgroundColor: widgetPalette[widget.color].background }]}>
      <View style={[styles.row, styles.topRow]}>
        <View style={styles.cell}>
          <AppText variant="small">{typeLabels[widget.type]}</AppText>
        </View>
        <Pressable
          style={[styles.cell, styles.button]}
          onPress={onOpen}
          accessibilityRole="button"
          accessibilityLabel={`${overlayLabel} for ${name}`}
        >
          <AppText variant="small">{overlayLabel}</AppText>
        </Pressable>
      </View>
      <View style={styles.row}>
        <TextField
          containerStyle={styles.cell}
          appearance="underline"
          style={styles.mainInput}
          label="Name"
          accessibilityLabel={`${name} name`}
          value={widget.name}
          maxLength={100}
          error={!widget.name.trim() ? 'Enter a widget name.' : undefined}
          onChangeText={(value) =>
            onChange({
              ...widget,
              name: value,
              rows:
                !fixed && widget.rows.length === 1
                  ? widget.rows.map((item) => ({ ...item, label: value }))
                  : widget.rows,
            })
          }
        />
        {!fixed && row && widget.rows.length === 1 ? (
          <TextField
            containerStyle={styles.cell}
            appearance="underline"
            style={[styles.mainInput, styles.alignRight]}
            label="DKK / month"
            accessibilityLabel={`${name} row 1 amount in DKK`}
            value={row.input}
            keyboardType="number-pad"
            maxLength={24}
            error={parseAmount(row).error}
            onChangeText={(input) => onChange({ ...widget, rows: [{ ...row, input }] })}
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
      </View>
      <View style={styles.row}>
        <View style={styles.cell} />
        <View style={styles.cell}>
          {progress.status !== 'invalid' &&
          progress.status !== 'overflow' &&
          (status === 'not-entered' || status === 'incomplete') ? (
            <AppText variant="small" style={styles.alignRight}>
              {status === 'not-entered' ? 'Not entered yet' : 'Some amounts missing'}
            </AppText>
          ) : null}
          <AllocationGuidance progress={progress} compact />
        </View>
      </View>
    </Card>
  );
}
const styles = StyleSheet.create({
  card: { borderRadius: 12, padding: spacing.large, gap: spacing.medium },
  alignRight: { textAlign: 'right' },
  amountText: { flexShrink: 1, textAlign: 'right' },
  row: { flexDirection: 'row', gap: spacing.medium, alignItems: 'flex-start' },
  topRow: { alignItems: 'center' },
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
  button: { minHeight: 44, justifyContent: 'center', alignItems: 'flex-end' },
});
