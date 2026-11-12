import type { BarangayWithCount } from '@kapitwatt/shared';
import { reliefForecast } from '@kapitwatt/sim';
import { useMemo } from 'react';
import { byTown } from '@/utils/format';
import { useBarangays, useCurrentAlert, useDemoControls, useTotals } from '@/api/queries';
import { useSimParams } from '@/hooks/sim-params';
import { useCommitSamples } from './useCommitSamples';

const NO_BARANGAYS: BarangayWithCount[] = [];

/**
 * The live load page's queries and the figures derived from them. Arrays keep their identity while
 * the polled data does, so the memoised sections skip a render that changes nothing they show.
 */
export function useLiveLoadFigures() {
  const alert = useCurrentAlert();
  const totals = useTotals(alert.data?.id);
  const barangays = useBarangays();
  const { params } = useSimParams();
  const demo = useDemoControls();

  const towns = useMemo(() => byTown(totals.data), [totals.data]);
  const status = totals.data?.status ?? alert.data?.status;
  const measured = status === 'settling' || status === 'settled';
  const failed = alert.error ?? totals.error;
  // Until the alert, and then its totals, first arrive: a placeholder, not the calm page or zeros.
  const loading = alert.isLoading || (Boolean(alert.data) && totals.isLoading);

  const target = totals.data?.targetKw ?? alert.data?.targetKw ?? 0;
  const committed = totals.data?.committedKw ?? 0;
  const delivered = totals.data?.deliveredKw ?? 0;
  // FR-DASH-14: relief forecast = committed kW x follow-through, less missed photos.
  const forecast = reliefForecast(committed, params).deliveredKw;
  const barangayCount = totals.data?.barangays.length || alert.data?.targetBarangayIds.length || 0;
  const barangaysHit = (totals.data?.barangays ?? []).filter((b) => b.targetHit).length;
  const committing = status === 'scheduled' || status === 'active' || status === 'window_open';
  const samples = useCommitSamples(
    alert.data?.id,
    committed,
    committing && totals.data !== undefined,
  );

  // The count is optional in the API response: unknown is not the same as zero.
  const pilot = barangays.data ?? NO_BARANGAYS;
  const householdsKnown = pilot.some((b) => b.optedInHouseholds !== undefined);
  const pilotHouseholds = pilot.reduce((sum, b) => sum + (b.optedInHouseholds ?? 0), 0);

  return {
    alert,
    totals,
    pilot,
    params,
    demo,
    towns,
    status,
    measured,
    failed,
    loading,
    target,
    committed,
    delivered,
    forecast,
    barangayCount,
    barangaysHit,
    committing,
    samples,
    householdsKnown,
    pilotHouseholds,
  };
}
