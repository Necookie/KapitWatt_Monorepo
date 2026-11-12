import { useQuery } from '@tanstack/react-query';
import { client } from '@/api/client';
import { keys, live } from '@/api/queries';

export function useAnalytics(alertId: string | undefined) {
  return useQuery({
    queryKey: keys.analytics(alertId ?? 'none'),
    queryFn: () => client.getAnalytics(alertId!),
    enabled: Boolean(alertId),
    ...live,
  });
}
