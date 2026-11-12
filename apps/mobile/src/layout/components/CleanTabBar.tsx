import { Icon, type IconName } from '@kapitwatt/icons';
import { themes } from '@kapitwatt/styles';
import { Text } from '@kapitwatt/ui';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fontFamily } from '@kapitwatt/tokens';
import { TabLantern } from './TabLantern';

const c = themes.light.color;

/** Icon per tab route. Routes not listed here are not shown in the bar. */
const TABS: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'Home', icon: 'home' },
  history: { label: 'History', icon: 'history' },
  leaderboard: { label: 'Leaderboard', icon: 'leaderboard' },
  profile: { label: 'Profile', icon: 'profile' },
};

/**
 * The "clean bar" from the mockups: white, a hairline on top, the active tab in primary with its
 * filled icon and a small lit lantern hanging above it.
 */
export function CleanTabBar({ state, emitter, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {state.routes.map((route, index) => {
        const tab = TABS[route.name];
        if (!tab) return null;
        const focused = state.index === index;
        const color = focused ? c.primary : c.onSurfaceVariant;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={tab.label}
            onPress={() => {
              // Same as expo-router's own tab bar: let screens intercept the press first.
              const event = emitter.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) navigateToTab(route.key);
            }}
            style={styles.tab}
          >
            <TabLantern on={focused} />
            <Icon name={tab.icon} weight={focused ? 'fill' : 'regular'} color={color} />
            <Text variant="labelMedium" style={[{ color }, focused && styles.labelOn]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: c.surfaceContainerLowest,
    borderTopWidth: 1,
    borderTopColor: c.outlineVariant,
    paddingHorizontal: 8,
  },
  // Room at the top for the active tab's lantern.
  tab: { flex: 1, alignItems: 'center', gap: 4, paddingTop: 16, minHeight: 60 },
  labelOn: { fontFamily: fontFamily.semibold },
});
