import type { UpdateTargetsInput } from '@kapitwatt/shared';
import { client } from '@/api/client';
import { useAction } from '@/api/queries';

/** Saves the operator's barangay target overrides for one alert. */
export function useUpdateTargets(
  alertId: string | undefined,
  targets: UpdateTargetsInput['targets'],
) {
  return useAction(() => client.updateTargets(alertId!, targets));
}
