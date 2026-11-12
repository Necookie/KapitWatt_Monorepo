import { useQuery } from '@tanstack/react-query';
import { client } from '@/api/client';
import { keys, live } from '@/api/queries';

export function useFlagged() {
  return useQuery({ queryKey: keys.flagged, queryFn: client.listFlagged, ...live });
}
