import { brownoutCopy, placeList, type AlertView } from '@kapitwatt/shared';
import { useBarangays } from '@/api/queries';

export interface BrownoutRisk {
  /** own: this household's barangay is at risk (shown in red). help: another town is. The words are
   *  the same for both, matching the one push every household gets. */
  kind: 'own' | 'help';
  headline: string;
  line: string;
}

/**
 * Demo: the alert's at-risk towns (simulated), for the alert card and the event screen. Null when
 * the alert marks none.
 */
export function useBrownoutRisk(
  alert: Pick<AlertView, 'atRiskBarangayIds'> | undefined,
  barangayId: string | undefined,
): BrownoutRisk | null {
  const barangays = useBarangays();
  const ids = alert?.atRiskBarangayIds ?? [];
  if (ids.length === 0 || !barangayId) return null;
  const place = placeList(
    (barangays.data ?? []).filter((b) => ids.includes(b.id)).map((b) => b.municipality),
  );
  if (!place) return null;
  return {
    kind: ids.includes(barangayId) ? 'own' : 'help',
    headline: brownoutCopy.headline(place),
    line: brownoutCopy.line(place),
  };
}
