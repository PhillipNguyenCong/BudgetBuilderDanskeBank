import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../foundation/components/AppText';
import { spacing } from '../../../foundation/theme/theme';
import { widgetPalette } from '../../budget-shared';
import { type DraftWidget } from '../editor/draft';

export function WidgetOverlayTotal({ widget, total }: { widget: DraftWidget; total: string }) {
  const fixed = widget.type === 'FIXED_EXPENSE';
  return (
    <View style={[styles.total, { backgroundColor: widgetPalette[widget.color].background }]}>
      <AppText variant="small" maxFontSizeMultiplier={2}>
        {fixed ? 'Set aside per month' : 'Total per month'}
      </AppText>
      <AppText
        variant="heading"
        style={styles.amount}
        maxFontSizeMultiplier={2}
        adjustsFontSizeToFit
        minimumFontScale={0.6}
        numberOfLines={1}
        accessibilityLiveRegion="polite"
      >
        {total}
      </AppText>
    </View>
  );
}
const styles = StyleSheet.create({
  amount: { fontSize: 22, lineHeight: 28 },
  total: {
    marginHorizontal: spacing.large,
    padding: spacing.large,
    borderRadius: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
});
