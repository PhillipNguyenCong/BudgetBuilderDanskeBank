import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../foundation/components/AppText';
import { spacing } from '../../../foundation/theme/theme';
import { widgetPalette } from '../../budget-shared';
import { type DraftWidget } from '../editor/draft';

export function WidgetOverlayTotal({ widget, total }: { widget: DraftWidget; total: string }) {
  const fixed = widget.type === 'FIXED_EXPENSE';
  return (
    <View style={[styles.total, { backgroundColor: widgetPalette[widget.color].background }]}>
      <AppText variant="small">{fixed ? 'Total' : 'Total per month'}</AppText>
      <AppText variant="title" accessibilityLiveRegion="polite">
        {total}
      </AppText>
    </View>
  );
}
const styles = StyleSheet.create({
  total: {
    marginHorizontal: spacing.large,
    padding: spacing.large,
    borderRadius: 16,
    gap: spacing.small,
  },
});
