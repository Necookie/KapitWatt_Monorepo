import { useBrandFonts } from '@kapitwatt/hooks';
import { ThemeProvider } from '@kapitwatt/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAlertWatcher } from '@/lib/alertWatcher';
import { ApiError } from '@/lib/api';
import { colors, text } from '@/theme';

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
  // Albert Sans is a few small files; hold the first paint until they load so text does not reflow.
  if (!useBrandFonts()) return null;
  return (
    // The household app ships light only (DESIGN.md).
    <ThemeProvider scheme="light">
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
        <AlertWatcher />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.navy },
            headerTintColor: colors.onDark,
            headerTitleStyle: { fontFamily: text.title.fontFamily },
            headerTitle: 'KapitWatt',
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          {/* Mockup page 2: no top bar on the first screen; the logo opens it. */}
          <Stack.Screen name="welcome" options={{ headerShown: false }} />
          <Stack.Screen name="sign-up" options={{ headerTitle: 'Join the pilot' }} />
          {/* Mockup page 1: a light top bar with only the back arrow; the screen has its heading. */}
          <Stack.Screen
            name="login"
            options={{
              headerTitle: '',
              headerStyle: { backgroundColor: colors.background },
              headerTintColor: colors.ink,
              headerShadowVisible: false,
            }}
          />
          <Stack.Screen name="forgot-password" options={{ headerTitle: 'Forgot password' }} />
          <Stack.Screen name="profile" options={{ headerTitle: 'Profile and privacy' }} />
          <Stack.Screen name="privacy" options={{ headerTitle: 'Privacy notice' }} />
          <Stack.Screen name="rehearsal" options={{ headerTitle: 'Practice run' }} />
          <Stack.Screen name="alert/[alertId]/commit" options={{ headerTitle: 'Commit a cut' }} />
          <Stack.Screen name="alert/[alertId]/capture" options={{ headerTitle: 'Meter photo' }} />
          <Stack.Screen name="alert/[alertId]/result" options={{ headerTitle: 'Your result' }} />
          <Stack.Screen name="leaderboard" options={{ headerTitle: 'Leaderboard' }} />
          <Stack.Screen name="history" options={{ headerTitle: 'History' }} />
        </Stack>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
