import { PILOT_TOWNS, type BarangayWithCount } from '@kapitwatt/shared';
import { about } from '@/utils/format';

export const approx = (n: number) => about(n).replace('about ', '≈ ');

/** Barangays grouped by town, pilot towns first in their order; towns with none are left out. */
export function groupByTown(all: BarangayWithCount[]): [string, BarangayWithCount[]][] {
  const groups = new Map<string, BarangayWithCount[]>();
  for (const town of PILOT_TOWNS) groups.set(town, []);
  for (const b of all) {
    const group = groups.get(b.municipality);
    if (group) group.push(b);
    else groups.set(b.municipality, [b]);
  }
  return [...groups].filter(([, list]) => list.length > 0);
}
