import { client } from '@/api/client';
import { useAction } from '@/api/queries';

export function useResetSim() {
  return useAction(() => client.simReset());
}
