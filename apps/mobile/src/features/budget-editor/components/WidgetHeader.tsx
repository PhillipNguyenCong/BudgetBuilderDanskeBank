import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../foundation/components/AppText';
import { colors } from '../../../foundation/theme/theme';
import { typeLabels } from '../../budget-shared';
import { type DraftWidget } from '../editor/draft';

export function WidgetHeader({ widget }: { widget: DraftWidget }) {
  return (
    <View style={styles.column}>
      <View style={styles.titleRow}>
        <AppText variant="label" style={styles.title}>
          {widget.type === 'SPENDING' ? 'Budget' : typeLabels[widget.type]}
        </AppText>
      </View>
      <AppText variant="small" style={styles.description}>
        Per month
      </AppText>
    </View>
  );
}
const styles = StyleSheet.create({
  column: { alignItems: 'flex-start', gap: 4 },
  titleRow: { minHeight: 44, justifyContent: 'center' },
  title: { fontSize: 16, lineHeight: 22 },
  description: { fontSize: 12, lineHeight: 16, color: colors.muted },
});
