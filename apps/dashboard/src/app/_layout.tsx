import { useBrandFonts } from '@kapitwatt/hooks';
import { ThemeProvider } from '@kapitwatt/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Slot } from 'expo-router';
import { AppShell } from '@/layout/AppShell';
import { GlobalStyles } from '@/styles/GlobalStyles';
import { SimParamsProvider } from '@/hooks/sim-params';

const queryClient = new QueryClient();

export default function RootLayout() {
  // Albert Sans is a few small files; hold the first paint until they load so the shell does not reflow.
  if (!useBrandFonts()) return null;
  return (
    <ThemeProvider scheme="light">
      <GlobalStyles />
      <QueryClientProvider client={queryClient}>
        <SimParamsProvider>
          <AppShell>
            <Slot />
          </AppShell>
        </SimParamsProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
