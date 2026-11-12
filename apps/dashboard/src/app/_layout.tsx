import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { colors } from '@/theme';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.navy },
          headerTintColor: '#FFFFFF',
          headerTitle: 'KapitWatt | Laguna pilot (simulated)',
        }}
      />
    </QueryClientProvider>
  );
}
