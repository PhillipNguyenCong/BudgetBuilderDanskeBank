import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../foundation/components/AppText';
import { colors } from '../../../foundation/theme/theme';
import { typeLabels } from '../../budget-shared';
import { type DraftWidget } from '../editor/draft';

const descriptions = {
  INCOME: 'Monthly salary',
  FIXED_EXPENSE: 'Monthly bills',
  SPENDING: 'Monthly budget',
  SAVINGS: 'Monthly savings',
};

export function WidgetHeader({ widget }: { widget: DraftWidget }) {
  return (
    <View style={styles.column}>
      <View style={styles.titleRow}>
        <AppText variant="label" style={styles.title}>
          {widget.type === 'INCOME'
            ? 'Income'
            : widget.type === 'SPENDING'
              ? widget.purpose
                ? widget.name
                : 'Budget'
              : typeLabels[widget.type]}
        </AppText>
      </View>
      <AppText variant="small" style={styles.description}>
        {widget.purpose === 'GROCERIES'
          ? 'Monthly groceries'
          : widget.purpose === 'FUN'
            ? 'Monthly fun'
            : descriptions[widget.type]}
      </AppText>
    </View>
  );
}
const styles = StyleSheet.create({
  column: { alignItems: 'flex-start', gap: 2 },
  titleRow: { justifyContent: 'center' },
  title: { fontSize: 16, lineHeight: 22 },
  description: { fontSize: 12, lineHeight: 16, color: colors.muted },
});
