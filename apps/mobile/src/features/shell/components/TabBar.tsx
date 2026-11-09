import { Pressable, StyleSheet, View } from 'react-native';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { AppText } from '../../../foundation/components/AppText';
import { colors, spacing } from '../../../foundation/theme/theme';
export function TabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  return (
    <View
      style={[
        styles.bar,
        {
          paddingBottom: insets.bottom,
          paddingLeft: insets.left + 8,
          paddingRight: insets.right + 8,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const selected = state.index === index;
        const label = descriptors[route.key].options.title ?? route.name;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected }}
            style={styles.tab}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!selected && !event.defaultPrevented)
                navigation.navigate(route.name, route.params);
            }}
            onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
          >
            <AppText variant="small" style={[styles.label, selected && styles.selected]}>
              {label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  tab: {
    flex: 1,
    minWidth: 44,
    minHeight: 72,
    paddingVertical: spacing.large,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: { color: colors.muted, textAlign: 'center' },
  selected: { color: colors.blue, textDecorationLine: 'underline' },
});
