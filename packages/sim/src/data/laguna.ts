import type { PilotTown } from '@kapitwatt/shared';

/**
 * Laguna pilot seed parameters. Household counts are SIMULATION PARAMETERS, not
 * real data. They sum to 1,200.
 */
export const TOWN_HOUSEHOLDS: Record<PilotTown, number> = {
  'Santa Cruz': 350,
  Nagcarlan: 200,
  Pila: 150,
  Victoria: 140,
  Liliw: 130,
  Magdalena: 120,
  Majayjay: 110,
};

/** 21 sampled barangays across the 7 towns. */
export const BARANGAYS_PER_TOWN = 3;

/**
 * Barangay names must come from the PSA list (PSGC) at seed time.
 * TODO(sim owner): fill in 3 real PSA barangay names per town. Until then the
 * seeder falls back to clearly fake placeholders ("Santa Cruz Brgy 1").
 */
export const BARANGAY_NAMES: Partial<Record<PilotTown, readonly string[]>> = {};

export function barangayNamesFor(town: PilotTown): string[] {
  const real = BARANGAY_NAMES[town] ?? [];
  return Array.from({ length: BARANGAYS_PER_TOWN }, (_, i) => real[i] ?? `${town} Brgy ${i + 1}`);
}

export const TOTAL_SIMULATED_HOUSEHOLDS = Object.values(TOWN_HOUSEHOLDS).reduce((a, b) => a + b, 0);
