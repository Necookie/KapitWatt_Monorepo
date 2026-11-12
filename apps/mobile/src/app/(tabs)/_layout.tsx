import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { hasAuthToken } from '@/api/http';
import { CleanTabBar } from '@/layout/components/CleanTabBar';
import { colors } from '@/styles/theme';

/**
 * The four main screens behind the clean bottom bar (mockups: "Nav 1 · Clean bar"). A phone with no
 * saved login starts at onboarding straight away, without waiting for the server to say so (with no
 * network, or no API address, it would otherwise sit on Home's loading and error screens).
 */
export default function TabsLayout() {
  if (!hasAuthToken()) return <Redirect href="/welcome" />;
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
