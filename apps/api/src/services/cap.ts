import { capKw, COMMIT_STEP_KW, MAX_COMMIT_KW, TRUST } from '@kapitwatt/shared';

/** The score narrows the cap below the start only: 25 (the start) keeps it, 0 leaves 75% of it. */
export const trustMultiplier = (trustScore: number): number =>
  Math.min(1, TRUST.capFloor + trustScore / 100);

/**
 * The largest cut a household may commit:
 *
 *   commit cap = min(baseline, bill cap, MAX_COMMIT_KW) x trust multiplier, rounded DOWN to the step
 *
 * Committing more than the baseline or the bill cap is pointless: settlement never pays beyond
 * either. Rounding down keeps the cap reachable with the 0.1 kW stepper without exceeding the limit.
 * The commit insert enforces the same rule in SQL. Returns null until the household has a baseline
 * (photo households: after the rehearsal).
 */
export function commitCapKw(
  baselineKw: number | null,
  billAvgKwhMonth: number,
  trustScore: number = TRUST.start,
): number | null {
  if (baselineKw === null) return null;
  const raw =
    Math.min(baselineKw, capKw(billAvgKwhMonth), MAX_COMMIT_KW) * trustMultiplier(trustScore);
  const steps = Math.floor(raw / COMMIT_STEP_KW + 1e-9);
  return Math.max(0, Number((steps * COMMIT_STEP_KW).toFixed(1)));
}
