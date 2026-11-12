import type { SimParams } from '@kapitwatt/shared';
import { client } from '@/api/client';
import { useAction } from '@/api/queries';

export function useSeed(params: SimParams) {
  return useAction(() => client.simSeed({ amiShare: params.amiShare, seed: params.seed }));
}
