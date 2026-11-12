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
        <StatusBar style="dark" />
        <AlertWatcher />
        <Stack
          screenOptions={{
            // Mockups: a light top bar with only the back arrow; each screen has its own heading.
            headerTitle: '',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.ink,
            headerShadowVisible: false,
            headerTitleStyle: { fontFamily: text.title.fontFamily },
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          {/* Home, History, Leaderboard and Profile, behind the clean bottom bar. */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          {/* No top bar on the first screen; the logo opens it. */}
          <Stack.Screen name="welcome" options={{ headerShown: false }} />
          {/* Sign-up draws its own top bar with progress. */}
          <Stack.Screen name="sign-up" options={{ headerShown: false }} />
          {/* The camera is full screen with its own close button. */}
          <Stack.Screen name="alert/[alertId]/capture" options={{ headerShown: false }} />
          <Stack.Screen name="forgot-password" options={{ headerTitle: 'Forgot password' }} />
          <Stack.Screen name="privacy" options={{ headerTitle: 'Privacy notice' }} />
        </Stack>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
