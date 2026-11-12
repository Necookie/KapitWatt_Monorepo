import { useBrandFonts } from '@kapitwatt/hooks';
import { ThemeProvider } from '@kapitwatt/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Slot } from 'expo-router';
import { AppShell } from '@/components/AppShell';
import { GlobalStyles } from '@/components/GlobalStyles';
import { SimParamsProvider } from '@/lib/sim-params';

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
