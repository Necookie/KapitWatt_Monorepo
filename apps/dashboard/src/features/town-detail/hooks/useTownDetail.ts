import { useLocalSearchParams } from 'expo-router';
import { useCurrentAlert, useTotals } from '@/api/queries';
import { byTown } from '@/utils/format';

/** The town named in the route, its totals under the current alert, and the alert's stage. */
export function useTownDetail() {
  const { town: param } = useLocalSearchParams<{ town: string }>();
  const name = Array.isArray(param) ? param[0] : param;
  const alert = useCurrentAlert();
  const totals = useTotals(alert.data?.id);

  const town = byTown(totals.data).find((t) => t.town === name);
  const status = totals.data?.status ?? alert.data?.status;
  const measured = status === 'settling' || status === 'settled';
  const failed = alert.error ?? totals.error;

  // Operator override of barangay shares (PRD: "the operator can override a barangay's
  // share"). The API accepts it until the window has ended.
  const editable = status === 'scheduled' || status === 'active' || status === 'window_open';

  return { name, alert, totals, town, measured, failed, editable };
}
