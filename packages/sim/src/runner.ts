import type { SimParams } from '@kapitwatt/shared';

/**
 * Event runner. The simulator is a backend data generator that runs REAL logic:
 * it never inserts rows itself. apps/api hands it this port, whose methods are
 * the same service functions real phones hit (commit, submit reading, AMI feed).
 * It acts as a service account for simulated rows only, never a superadmin.
 */
export interface SimPort {
  /** Simulated households in the alert's target barangays. */
  listSimulatedHouseholds(alertId: string): Promise<SimHousehold[]>;
  commit(householdId: string, alertId: string, committedKw: number): Promise<void>;
  /** Photo path: before and after readings. Smart-meter path: AMI interval rows. All flagged simulated. */
  submitReadings(householdId: string, alertId: string, readings: SimReading[]): Promise<void>;
  /** Waits between paced commits. Injected so tests can run instantly. */
  sleep(ms: number): Promise<void>;
}

export interface SimHousehold {
  id: string;
  meterType: 'ami' | 'standard';
  baselineKw: number;
  lastReadingKwh: number;
}

export interface SimReading {
  kind: 'before' | 'after';
  readingKwh: number;
  /** Offset from window start, in minutes. */
  atMinute: number;
}

export interface RunSummary {
  households: number;
  committed: number;
  committedKw: number;
  readingsSubmitted: number;
}

/**
 * TODO(sim owner), P0:
 *  1. Pick `participation` of the households (seeded rng) and commit `cutKw` each,
 *     spread over `paceSeconds` so the dashboard total rises gradually.
 *  2. After the window (or on fast-forward), generate readings:
 *     - delivered cut = cutKw x followThrough, with +/- baselineNoise on the baseline
 *     - photo households: skip (1 - photoCompletion) of them, so they earn nothing
 *     - smart-meter households: 5-minute AMI interval rows
 *  3. Return a per-run summary (per-town breakdown is P1).
 * Settlement itself is NOT done here; the API settles simulated and real rows the same way.
 */
export async function runEvent(
  _alertId: string,
  _params: SimParams,
  _port: SimPort,
): Promise<RunSummary> {
  throw new Error('@kapitwatt/sim: runEvent not implemented yet');
}
