import { useQuery } from '@tanstack/react-query';
import { client } from '@/api/client';
import { keys, live } from '@/api/queries';

export function useAlertLog() {
  return useQuery({ queryKey: keys.alertLog, queryFn: client.listAlerts, ...live });
}
