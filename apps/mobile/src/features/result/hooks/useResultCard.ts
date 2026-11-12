import { contributionDelta } from '@kapitwatt/shared';
import { useLocalSearchParams } from 'expo-router';
import { useAlert, useMe, useMyEventStatus, useResult } from '@/api/queries';
import { receiptSteps } from '../utils/receipt-steps';

/**
 * A night's receipt for the alert in the route, once settled: the result, the alert (its date,
 * level and window), the household's steps that night, the arithmetic, its Contribution Score
 * change and its level now.
 */
export function useResultCard() {
  const { alertId } = useLocalSearchParams<{ alertId: string }>();
  const result = useResult(alertId);
  const alert = useAlert(alertId);
  const status = useMyEventStatus(alertId);
  const me = useMe();
  const refetch = () => Promise.all([result.refetch(), status.refetch()]);

  if (result.isPending || alert.isPending || status.isPending || me.isPending) {
    return { state: 'pending' as const };
  }
  if (result.isError || alert.isError || status.isError || me.isError) {
    return { state: 'error' as const, refetch };
  }

  const r = result.data;
  if (!r) return { state: 'unsettled' as const, refetch };

  const paid = r.zeroReason === null;
  const view = alert.data;
  const hours =
    (new Date(view.alert.windowEnd).getTime() - new Date(view.alert.windowStart).getTime()) /
    3_600_000;

  return {
    state: 'ready' as const,
    refetch,
    result: r,
    view,
    commitment: status.data.commitment,
    steps: receiptSteps(view, status.data, r),
    hours,
    // The same rule settlement applies to the stored score.
    change: contributionDelta(paid, r.zeroReason),
    score: me.data.trustScore,
  };
}
