import { PILOT_TOWN_CENTERS, type BarangayTotals, type PilotTown } from '@kapitwatt/shared';
import type L from 'leaflet';

/** Barangays sit on a ring this far from their town centre (about 0.8 km). */
export const RING_DEG = 0.0075;

/**
 * Layout only. Each ring's first barangay points this way (radians, 0 = east), and the town name
 * sits on this side of the ring. Nagcarlan and Liliw are about 2 km apart, so their rings point
 * away from each other and their names go west and south.
 */
const RING_START: Partial<Record<PilotTown, number>> = { Nagcarlan: Math.PI, Liliw: 0 };
export const LABEL_SIDE: Partial<Record<PilotTown, 'left' | 'below'>> = {
  Nagcarlan: 'left',
  Liliw: 'below',
};

const isTown = (town: string): town is PilotTown => town in PILOT_TOWN_CENTERS;

/** A point `distance` degrees from a town centre in direction `angle` (corrected for latitude). */
export function offset(
  c: { lat: number; lng: number },
  angle: number,
  distance: number,
): L.LatLngTuple {
  return [
    c.lat + distance * Math.sin(angle),
    c.lng + (distance * Math.cos(angle)) / Math.cos((c.lat * Math.PI) / 180),
  ];
}

/** Approximate positions: each town's barangays evenly around its centre, in name order. */
export function placements(barangays: BarangayTotals[]): Map<string, L.LatLngTuple> {
  const out = new Map<string, L.LatLngTuple>();
  const towns = [...new Set(barangays.map((b) => b.municipality))].filter(isTown);
  for (const town of towns) {
    const members = barangays
      .filter((b) => b.municipality === town)
      .sort((a, b) => a.name.localeCompare(b.name));
    const start = RING_START[town] ?? -Math.PI / 2;
    members.forEach((b, i) => {
      const angle = start + (i * 2 * Math.PI) / members.length;
      out.set(b.barangayId, offset(PILOT_TOWN_CENTERS[town], angle, RING_DEG));
    });
  }
  return out;
}
