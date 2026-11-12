import type { SimParams } from '@kapitwatt/shared';
import { client } from '@/api/client';
import { SIM_COMMIT_RUN, useAction } from '@/api/queries';

export function useRunEvent(params: SimParams) {
  return useAction((alertId: string) => client.simRun(alertId, params, 'commit'), SIM_COMMIT_RUN);
}
