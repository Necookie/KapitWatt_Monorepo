import { PILOT_TOWNS, type MeterType, type PilotTown, type SimParams } from '@kapitwatt/shared';
import { TOWN_HOUSEHOLDS, barangayNamesFor } from './data/laguna';
import { createRng } from './rng';

export interface SeedBarangay {
  name: string;
  municipality: PilotTown;
}

export interface SeedHousehold {
  barangay: SeedBarangay;
  meterType: MeterType;
  meterSerial: string;
  billAvgKwhMonth: number;
  baselineKw: number;
  isSimulated: true;
}

export interface LagunaSeed {
  barangays: SeedBarangay[];
  households: SeedHousehold[];
}

/**
 * Builds the Laguna seed in memory: 7 towns, 21 barangays, about 1,200 households.
 * Pure and deterministic for a given seed. It does NOT write anything: POST /sim/seed
 * in apps/api passes the result through the same registration code real households use.
 */
export function buildLagunaSeed(params: Pick<SimParams, 'amiShare' | 'seed'>): LagunaSeed {
  const rng = createRng(params.seed);
  const barangays: SeedBarangay[] = [];
  const households: SeedHousehold[] = [];

  for (const town of PILOT_TOWNS) {
    const townBarangays = barangayNamesFor(town).map((name) => ({ name, municipality: town }));
    barangays.push(...townBarangays);

    for (let i = 0; i < TOWN_HOUSEHOLDS[town]; i++) {
      const barangay = townBarangays[i % townBarangays.length]!;
      // Assumed residential spread: 360 to 650 kWh a month, evening baseline 1.2 to 2.6 kW.
      // The floor is 360 because the bill cap (peak factor 2 x bill / 720) must allow the
      // default 1 kW cut; a lower bill would have its commitment refused or its cut clipped.
      households.push({
        barangay,
        meterType: rng() < params.amiShare ? 'ami' : 'standard',
        meterSerial: `SIM-${town.slice(0, 3).toUpperCase()}-${String(i + 1).padStart(4, '0')}`,
        billAvgKwhMonth: Math.round(360 + rng() * 290),
        baselineKw: Math.round((1.2 + rng() * 1.4) * 10) / 10,
        isSimulated: true,
      });
    }
  }
  return { barangays, households };
}
