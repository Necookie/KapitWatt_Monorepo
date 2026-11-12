import type { AlertTotals, BarangayTotals } from '@kapitwatt/shared';

const LOCALE = 'en-PH';

/** kW is kept to 0.1; large totals drop the decimal so they stay readable at a glance. */
export function kw(value: number): string {
  const digits = Math.abs(value) >= 100 || Number.isInteger(value) ? 0 : 1;
  return value.toLocaleString(LOCALE, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/** A load in the unit an operator would say it in: kW below 1 MW, MW from there up. */
export function power(valueKw: number): string {
  if (Math.abs(valueKw) < 1000) return `${kw(valueKw)} kW`;
  return `${(valueKw / 1000).toLocaleString(LOCALE, { maximumFractionDigits: 2 })} MW`;
}

export const count =(value: number): string => value.toLocaleString(LOCALE);

export function percent(part: number, whole: number): string {
  return whole > 0 ? `${Math.round((part / whole) * 100)}%` : '0%';
}

export const fraction = (value: number): string => `${Math.round(value * 100)}%`;

export function clock(iso: string): string {
  return new Date(iso).toLocaleTimeString(LOCALE, { hour: 'numeric', minute: '2-digit' });
}

export function dayAndClock(iso: string): string {
  return new Date(iso).toLocaleString(LOCALE, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** "about 1,200": household counts are simulation parameters, so never show false precision. */
export function about(value: number): string {
  const step = value >= 1000 ? 50 : value >= 100 ? 10 : 1;
  return `about ${count(Math.round(value / step) * step)}`;
}

export interface TownTotals {
  town: string;
  /** False when the API left household counts out; `households` is then not a real zero. */
  householdsKnown: boolean;
  households: number;
  committedHouseholds: number;
  targetKw: number;
  committedKw: number;
  deliveredKw: number;
  deliveredAmiKw: number;
  deliveredPhotoKw: number;
  barangays: BarangayTotals[];
  barangaysHit: number;
}

/** Rolls barangay rows up to towns, largest target first. */
export function byTown(totals: AlertTotals | undefined): TownTotals[] {
  const towns = new Map<string, TownTotals>();
  for (const b of totals?.barangays ?? []) {
    let town = towns.get(b.municipality);
    if (!town) {
      town = {
        town: b.municipality,
        householdsKnown: false,
        households: 0,
        committedHouseholds: 0,
        targetKw: 0,
        committedKw: 0,
        deliveredKw: 0,
        deliveredAmiKw: 0,
        deliveredPhotoKw: 0,
        barangays: [],
        barangaysHit: 0,
      };
      towns.set(b.municipality, town);
    }
    if (b.households !== undefined) town.householdsKnown = true;
    town.households += b.households ?? 0;
    town.committedHouseholds += b.committedHouseholds ?? 0;
    town.targetKw += b.targetKw;
    town.committedKw += b.committedKw;
    town.deliveredKw += b.deliveredKw;
    town.deliveredAmiKw += b.deliveredAmiKw ?? 0;
    town.deliveredPhotoKw += b.deliveredPhotoKw ?? 0;
    town.barangays.push(b);
    if (b.targetHit) town.barangaysHit += 1;
  }
  return [...towns.values()].sort((a, b) => b.targetKw - a.targetKw);
}
