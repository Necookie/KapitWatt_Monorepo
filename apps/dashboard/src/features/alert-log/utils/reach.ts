import type { DashboardAlert } from '@/api/client';

/**
 * "All pilot areas", "3 barangays in Santa Cruz" or "5 barangays in 2 towns". `townOf` maps a
 * barangay id to its town; `pilotSize` is the number of pilot barangays.
 */
export function reach(a: DashboardAlert, townOf: Map<string, string>, pilotSize: number): string {
  const n = a.targetBarangayIds.length;
  if (n === 0 || (pilotSize > 0 && n === pilotSize)) return 'All pilot areas';
  const towns = [...new Set(a.targetBarangayIds.map((id) => townOf.get(id)))].filter(
    (town): town is string => town !== undefined,
  );
  const what = `${n} ${n === 1 ? 'barangay' : 'barangays'}`;
  if (towns.length === 0) return what;
  return towns.length === 1 ? `${what} in ${towns[0]}` : `${what} in ${towns.length} towns`;
}
