import { reliefForecast } from '@kapitwatt/sim';
import { byTown } from '@/utils/format';
import { useBarangays, useCurrentAlert, useDemoControls, useTotals } from '@/api/queries';
import { useSimParams } from '@/hooks/sim-params';
import { useCommitSamples } from './useCommitSamples';

/** The live load page's queries and the figures derived from them. */
export function useLiveLoadFigures() {
  const alert = useCurrentAlert();
  const totals = useTotals(alert.data?.id);
  const barangays = useBarangays();
  const { params } = useSimParams();
  const demo = useDemoControls();

  const towns = byTown(totals.data);
  const status = totals.data?.status ?? alert.data?.status;
  const measured = status === 'settling' || status === 'settled';
  const failed = alert.error ?? totals.error;

  const target = totals.data?.targetKw ?? alert.data?.targetKw ?? 0;
  const committed = totals.data?.committedKw ?? 0;
  const delivered = totals.data?.deliveredKw ?? 0;
  // FR-DASH-14: relief forecast = committed kW x follow-through, less missed photos.
  const forecast = reliefForecast(committed, params).deliveredKw;
  const barangayRows = totals.data?.barangays ?? [];
  const barangaysHit = barangayRows.filter((b) => b.targetHit).length;
  const committing = status === 'scheduled' || status === 'active' || status === 'window_open';
  const samples = useCommitSamples(
    alert.data?.id,
    committed,
    committing && totals.data !== undefined,
  );

  // The count is optional in the API response: unknown is not the same as zero.
  const householdsKnown = (barangays.data ?? []).some((b) => b.optedInHouseholds !== undefined);
  const pilotHouseholds = (barangays.data ?? []).reduce(
    (sum, b) => sum + (b.optedInHouseholds ?? 0),
    0,
  );

  return {
    alert,
    totals,
    barangays,
    params,
    demo,
    towns,
    status,
    measured,
    failed,
    target,
    committed,
    delivered,
    forecast,
    barangayRows,
    barangaysHit,
    committing,
    samples,
    householdsKnown,
    pilotHouseholds,
  };
}
