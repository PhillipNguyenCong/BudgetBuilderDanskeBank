import { StyleSheet, View } from 'react-native';
import { colors } from '../../../foundation/theme/theme';

export function TabIcon({ name, selected }: { name: string; selected: boolean }) {
  const color = selected ? colors.blue : colors.muted;
  return (
    <View accessible={false} importantForAccessibility="no-hide-descendants" style={styles.frame}>
      {name === 'more' ? (
        <View style={styles.dots}>
          {[0, 1, 2].map((key) => (
            <View key={key} style={[styles.dot, { backgroundColor: color }]} />
          ))}
        </View>
      ) : name === 'budget' ? (
        <View style={styles.bars}>
          {[10, 20, 15].map((height, key) => (
            <View key={key} style={[styles.bar, { height, backgroundColor: color }]} />
          ))}
        </View>
      ) : name === 'cards' ? (
        <View style={[styles.card, { borderColor: color }]}>
          <View style={[styles.stripe, { backgroundColor: color }]} />
        </View>
      ) : (
        <View style={styles.house}>
          <View style={[styles.roof, { borderColor: color }]} />
          <View style={[styles.base, { borderColor: color }]} />
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  frame: { width: 28, height: 26, alignItems: 'center', justifyContent: 'center' },
  dots: { flexDirection: 'row', gap: 4 },
  dot: { width: 4, height: 4, borderRadius: 2 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  bar: { width: 4, borderRadius: 2 },
  card: { width: 24, height: 18, borderWidth: 1.8, borderRadius: 4, paddingTop: 4 },
  stripe: { height: 3 },
  house: { width: 22, height: 24 },
  roof: {
    width: 15,
    height: 15,
    borderTopWidth: 1.8,
    borderLeftWidth: 1.8,
    transform: [{ rotate: '45deg' }],
    position: 'absolute',
    top: 3,
    left: 3.5,
  },
  base: {
    width: 18,
    height: 14,
    borderWidth: 1.8,
    borderTopWidth: 0,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    position: 'absolute',
    bottom: 0,
    left: 2,
  },
});
