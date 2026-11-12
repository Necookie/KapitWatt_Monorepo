import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Slot } from 'expo-router';
import { AppShell } from '@/components/AppShell';
import { SimParamsProvider } from '@/lib/sim-params';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SimParamsProvider>
        <AppShell>
          <Slot />
        </AppShell>
      </SimParamsProvider>
    </QueryClientProvider>
  );
}
