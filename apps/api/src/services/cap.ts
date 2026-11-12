import { capKw, COMMIT_STEP_KW, MAX_COMMIT_KW } from '@kapitwatt/shared';

/**
 * The largest cut a household may commit (P0 rule; the trust score narrows it in P1).
 *
 *   commit cap = min(baseline, bill cap, MAX_COMMIT_KW), rounded DOWN to the commit step
 *
 * Committing more than the baseline or the bill cap is pointless: settlement never pays beyond
 * either. Rounding down keeps the cap reachable with the 0.1 kW stepper without exceeding the limit.
 * Returns null until the household has a baseline (photo households: after the rehearsal).
 */
export function commitCapKw(baselineKw: number | null, billAvgKwhMonth: number): number | null {
  if (baselineKw === null) return null;
  const raw = Math.min(baselineKw, capKw(billAvgKwhMonth), MAX_COMMIT_KW);
  const steps = Math.floor(raw / COMMIT_STEP_KW + 1e-9);
  return Math.max(0, Number((steps * COMMIT_STEP_KW).toFixed(1)));
}
