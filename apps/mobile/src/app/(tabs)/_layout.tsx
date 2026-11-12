import { Tabs } from 'expo-router/js-tabs';
import { CleanTabBar } from '@/components/CleanTabBar';
import { colors } from '@/theme';

/** The four main screens behind the clean bottom bar (mockups: "Nav 1 · Clean bar"). */
export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CleanTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="history" options={{ title: 'History' }} />
      <Tabs.Screen name="leaderboard" options={{ title: 'Leaderboard' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
