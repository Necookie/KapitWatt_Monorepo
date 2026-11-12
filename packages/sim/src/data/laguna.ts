import { PILOT_BARANGAYS, type PilotTown } from '@kapitwatt/shared';

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

/** 21 sampled barangays across the 7 towns (real PSA names, see PILOT_BARANGAYS in shared). */
export function barangayNamesFor(town: PilotTown): string[] {
  return [...PILOT_BARANGAYS[town]];
}

export const TOTAL_SIMULATED_HOUSEHOLDS = Object.values(TOWN_HOUSEHOLDS).reduce((a, b) => a + b, 0);
