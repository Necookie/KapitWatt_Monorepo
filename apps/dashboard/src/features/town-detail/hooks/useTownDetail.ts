import { reliefForecast } from '@kapitwatt/sim';
import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { useCurrentAlert, useTotals } from '@/api/queries';
import { useSimParams } from '@/hooks/sim-params';
import { byTown } from '@/utils/format';

/** The town named in the route, its totals under the current alert, and the alert's stage. */
export function useTownDetail() {
  const { town: param } = useLocalSearchParams<{ town: string }>();
  const name = Array.isArray(param) ? param[0] : param;
  const alert = useCurrentAlert();
  const totals = useTotals(alert.data?.id);
  const { params } = useSimParams();

  const town = useMemo(() => byTown(totals.data).find((t) => t.town === name), [totals.data, name]);
  const status = totals.data?.status ?? alert.data?.status;
  const measured = status === 'settling' || status === 'settled';
  const failed = alert.error ?? totals.error;
  // Until the alert, and then its totals, first arrive.
  const loading = alert.isLoading || (Boolean(alert.data) && totals.isLoading);
  // FR-DASH-14: the town's relief forecast, the same assumption as the live view's.
  const forecast = town ? reliefForecast(town.committedKw, params).deliveredKw : 0;

  // Operator override of barangay shares (PRD: "the operator can override a barangay's
  // share"). The API accepts it until the window has ended.
  const editable = status === 'scheduled' || status === 'active' || status === 'window_open';

  return { name, alert, totals, town, status, measured, failed, loading, forecast, editable };
}
