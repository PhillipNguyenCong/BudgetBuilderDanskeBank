import type { AllocationProgress } from '@budget-builder/budget-core/allocations';
import { StyleSheet, View } from 'react-native';
import { Card } from '../../../foundation/components/Card';
import { TextField } from '../../../foundation/components/TextField';
import { fonts, spacing } from '../../../foundation/theme/theme';
import { widgetPalette } from '../../budget-shared';
import { type DraftWidget } from '../editor/draft';
import { WidgetAllocationStatus } from './WidgetAllocationStatus';
import { WidgetAmount } from './WidgetAmount';
import { WidgetHeader } from './WidgetHeader';

export function BudgetWidget({
  widget,
  onOpen,
  onChange,
  onAmountBlur,
  progress,
}: {
  widget: DraftWidget;
  onOpen: () => void;
  onChange: (widget: DraftWidget) => void;
  onAmountBlur: (rowId: string) => void;
  progress: AllocationProgress;
}) {
  const name = widget.name || 'Unnamed widget';
  const fixed = widget.type === 'FIXED_EXPENSE';
  const hasBillInput = fixed && widget.rows.some((item) => item.input.trim() !== '');
  const overlayLabel = hasBillInput ? 'Edit bills' : 'Settings';
  return (
    <Card style={[styles.card, { backgroundColor: widgetPalette[widget.color].background }]}>
      <WidgetHeader widget={widget} overlayLabel={overlayLabel} onOpen={onOpen} />
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
        <WidgetAmount
          widget={widget}
          onOpen={onOpen}
          onChange={onChange}
          onAmountBlur={onAmountBlur}
        />
      </View>
      <WidgetAllocationStatus progress={progress} widgetId={widget.id} />
    </Card>
  );
}
const styles = StyleSheet.create({
  card: { borderRadius: 24, padding: spacing.screen, gap: spacing.medium },
  row: { flexDirection: 'row', gap: spacing.medium, alignItems: 'flex-start' },
  mainInput: { fontSize: 20, lineHeight: 28, fontFamily: fonts.semibold, minHeight: 54 },
  cell: { flex: 1, minWidth: 0, gap: spacing.small },
});
