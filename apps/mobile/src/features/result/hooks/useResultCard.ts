import { contributionDelta } from '@kapitwatt/shared';
import { useLocalSearchParams } from 'expo-router';
import { useResult } from '@/api/queries';

/** The result for the alert in the route, once settled, and its Contribution Score change. */
export function useResultCard() {
  const { alertId } = useLocalSearchParams<{ alertId: string }>();
  const result = useResult(alertId);

  if (result.isPending) return { state: 'pending' as const };
  if (result.isError) return { state: 'error' as const, refetch: result.refetch };

  const r = result.data;
  if (!r) return { state: 'unsettled' as const, refetch: result.refetch };

  const paid = r.zeroReason === null;
  // The same rule settlement applies to the stored score.
  const change = contributionDelta(paid, r.zeroReason);

  return { state: 'ready' as const, refetch: result.refetch, result: r, change };
}
