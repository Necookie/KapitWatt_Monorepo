import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAlertWatcher } from '@/lib/alertWatcher';
import { ApiError } from '@/lib/api';
import { colors } from '@/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // A 4xx (not signed up, not found) will not fix itself; retry only network and 5xx errors.
      retry: (count, error) =>
        !(error instanceof ApiError && error.status >= 400 && error.status < 500) && count < 3,
    },
  },
});

/** Watches for new alerts and shows a local notification (in-app stand-in for push). */
function AlertWatcher() {
  useAlertWatcher();
  return null;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <AlertWatcher />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.navy },
          headerTintColor: colors.onDark,
          headerTitle: 'KapitWatt',
        }}
      >
        <Stack.Screen name="sign-up" options={{ headerTitle: 'Join the pilot' }} />
        <Stack.Screen name="rehearsal" options={{ headerTitle: 'Practice run' }} />
        <Stack.Screen name="alert/[alertId]/commit" options={{ headerTitle: 'Commit a cut' }} />
        <Stack.Screen name="alert/[alertId]/capture" options={{ headerTitle: 'Meter photo' }} />
        <Stack.Screen name="alert/[alertId]/result" options={{ headerTitle: 'Your result' }} />
        <Stack.Screen name="leaderboard" options={{ headerTitle: 'Leaderboard' }} />
        <Stack.Screen name="history" options={{ headerTitle: 'History' }} />
      </Stack>
    </QueryClientProvider>
  );
}
