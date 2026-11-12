import { useBrandFonts } from '@kapitwatt/hooks';
import { ThemeProvider, themes } from '@kapitwatt/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAlertWatcher } from '@/layout/hooks/useAlertWatcher';
import { ApiError } from '@/api/http';

const c = themes.light.color;

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
            headerStyle: { backgroundColor: c.surface },
            headerTintColor: c.onSurface,
            headerShadowVisible: false,
            headerTitleStyle: { fontFamily: themes.light.text.titleLarge.fontFamily },
            contentStyle: { backgroundColor: c.surface },
          }}
        >
          {/* Home, History, Leaderboard and Profile, behind the clean bottom bar. */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          {/* No top bar on the first screen; the logo opens it. */}
          <Stack.Screen name="welcome" options={{ headerShown: false }} />
          {/* Sign-up draws its own top bar with progress. It fades in: from the welcome page it opens
              on the white sheet that has just risen to fill the screen. */}
          <Stack.Screen name="sign-up" options={{ headerShown: false, animation: 'fade' }} />
          <Stack.Screen name="login" options={{ headerShown: false, animation: 'fade' }} />
          {/* The camera is full screen with its own close button. */}
          {/* The event and committing a cut draw the tabs' night band, with its own back arrow. */}
          <Stack.Screen name="alert/[alertId]/index" options={{ headerShown: false }} />
          <Stack.Screen name="alert/[alertId]/commit" options={{ headerShown: false }} />
          <Stack.Screen name="alert/[alertId]/capture" options={{ headerShown: false }} />
          <Stack.Screen name="forgot-password" options={{ headerTitle: 'Forgot password' }} />
          <Stack.Screen name="privacy" options={{ headerTitle: 'Privacy notice' }} />
        </Stack>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
