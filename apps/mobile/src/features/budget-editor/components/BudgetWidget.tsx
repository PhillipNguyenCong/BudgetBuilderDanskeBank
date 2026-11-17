import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Card } from '../../../foundation/components/Card';
import { widgetPalette } from '../../budget-shared';
import { type DraftWidget } from '../editor/draft';
import { WidgetAmount } from './WidgetAmount';
import { WidgetHeader } from './WidgetHeader';
import { WidgetIcon } from './WidgetIcon';

export function BudgetWidget({
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
  const { fontScale } = useWindowDimensions();
  return (
    <Card
      style={[
        styles.card,
        {
          backgroundColor:
            widgetPalette[widget.type === 'SAVINGS' ? 'MINT' : widget.color].background,
        },
      ]}
    >
      <View style={styles.outerRow}>
        <WidgetIcon type={widget.type} />
        <View
          style={[
            styles.row,
            fontScale > 1.3 && { flexDirection: 'column', alignItems: 'stretch' },
          ]}
        >
          <View style={styles.nameCell}>
            <WidgetHeader widget={widget} />
          </View>
          <View style={[styles.amountCell, fontScale > 1.3 && { width: '100%' }]}>
            <WidgetAmount
              widget={widget}
              onOpen={onOpen}
              onChange={onChange}
              onAmountBlur={onAmountBlur}
            />
          </View>
        </View>
      </View>
    </Card>
  );
}
const styles = StyleSheet.create({
  card: { borderRadius: 22, paddingHorizontal: 14, paddingVertical: 12 },
  outerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  row: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  nameCell: { flex: 1, flexBasis: 0, minWidth: 0, alignItems: 'flex-start' },
  amountCell: { width: '52%', minWidth: 0, gap: 0 },
});
