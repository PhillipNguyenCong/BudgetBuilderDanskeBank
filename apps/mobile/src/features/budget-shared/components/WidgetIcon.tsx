import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { widgetColor, type widgetColors } from '../model/widgetPresentation';
import { colors } from '../../../foundation/theme/theme';

const iconPaths = {
  groceries: 'M3 10h18l-2 10H5L3 10ZM7 10l4-6m6 6-4-6M9 13l1 4m5-4-1 4',
  income: 'M3 8h16v11H3zM6 5h16v11M13 13.5a2 2 0 1 0-4 0 2 2 0 1 0 4 0ZM6 13.5h.1m10 0h.1',
  savings:
    'M7 8c1-1 3-2 5-2h1l3-2v4c1 .6 2 1.6 3 3h2v5h-3l-2 2v2h-3v-2h-4v2H6v-3c-2-1-3-3-3-5s1-3 2-4M3 12c-1 0-2-1-2-2m8-1h4m3 3h.1',
  lock: 'M5 10h14v11H5zM8 10V7a4 4 0 0 1 8 0v3m-4 4v3',
};

/** Decorative category marks; the adjacent fixed label carries their meaning. */
export function WidgetIcon({
  type,
  purpose,
}: {
  type: keyof typeof widgetColors;
  purpose?: string | undefined;
}) {
  const path =
    type === 'SPENDING'
      ? purpose === 'GROCERIES'
        ? iconPaths.groceries
        : undefined
      : type === 'FIXED_EXPENSE'
        ? iconPaths.lock
        : type === 'SAVINGS'
          ? iconPaths.savings
          : iconPaths.income;
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[styles.tile, { backgroundColor: widgetColor(type, purpose).accent }]}
    >
      {path ? (
        <Svg width={23} height={23} viewBox="0 0 24 24">
          <Path
            d={path}
            fill="none"
            stroke={colors.white}
            strokeWidth={1.65}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      ) : (
        <View style={styles.bars}>
          {[9, 18, 13].map((height, index) => (
            <View key={index} style={[styles.bar, { height }]} />
          ))}
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  tile: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  bar: { width: 4, backgroundColor: colors.white, borderRadius: 1 },
});
