import { StyleSheet, View } from 'react-native';
import type { DraftWidget } from '../editor/draft';
import { colors } from '../../../foundation/theme/theme';

/** Decorative category marks; the adjacent fixed label carries their meaning. */
export function WidgetIcon({ type }: { type: DraftWidget['type'] }) {
  return (
    <View accessible={false} importantForAccessibility="no-hide-descendants" style={styles.tile}>
      {type === 'SPENDING' ? (
        <View style={styles.bars}>
          {[9, 18, 13].map((height, index) => (
            <View key={index} style={[styles.bar, { height }]} />
          ))}
        </View>
      ) : type === 'FIXED_EXPENSE' ? (
        <View style={styles.bill}>
          <View style={styles.line} />
          <View style={styles.line} />
          <View style={styles.line} />
        </View>
      ) : type === 'SAVINGS' ? (
        <View style={styles.jar}>
          <View style={styles.slot} />
        </View>
      ) : (
        <View style={styles.income}>
          <View style={styles.stem} />
          <View style={styles.arrow} />
          <View style={styles.tray} />
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
    backgroundColor: colors.blue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  bar: { width: 4, backgroundColor: colors.white, borderRadius: 1 },
  bill: {
    width: 16,
    height: 22,
    borderWidth: 1.5,
    borderColor: colors.white,
    borderRadius: 2,
    padding: 3,
    gap: 3,
  },
  line: { height: 1.5, backgroundColor: colors.white },
  jar: {
    width: 20,
    height: 18,
    borderWidth: 1.5,
    borderColor: colors.white,
    borderRadius: 5,
    alignItems: 'center',
  },
  slot: { width: 9, height: 1.5, backgroundColor: colors.white, marginTop: 4 },
  income: { width: 22, height: 24, alignItems: 'center' },
  stem: { width: 1.5, height: 13, backgroundColor: colors.white },
  arrow: {
    width: 8,
    height: 8,
    borderRightWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: colors.white,
    transform: [{ rotate: '45deg' }],
    position: 'absolute',
    top: 5,
  },
  tray: {
    width: 20,
    height: 7,
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderColor: colors.white,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    marginTop: 4,
  },
});
