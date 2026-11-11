import { Pressable, StyleSheet, View } from 'react-native';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { AppText } from '../../../foundation/components/AppText';
import { TabIcon } from './TabIcon';
import { colors, spacing } from '../../../foundation/theme/theme';
export function TabBar({ state, descriptors, emitter, navigateToTab, insets }: BottomTabBarProps) {
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
            style={({ pressed }) => [
              styles.tab,
              selected && styles.activeTab,
              pressed && styles.pressed,
            ]}
            onPress={() => {
              const event = emitter.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!selected && !event.defaultPrevented) navigateToTab(route.key);
            }}
            onLongPress={() => emitter.emit({ type: 'tabLongPress', target: route.key })}
          >
            <TabIcon name={route.name} selected={selected} />
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
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 32,
    paddingTop: 6,
    gap: 4,
  },
  tab: {
    flex: 1,
    minWidth: 44,
    minHeight: 60,
    paddingVertical: spacing.small,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: { color: colors.muted, textAlign: 'center', fontSize: 12, lineHeight: 18 },
  activeTab: { backgroundColor: colors.tint, borderRadius: 26 },
  pressed: { opacity: 0.65 },
  selected: { color: colors.blue, fontWeight: '600' },
});
