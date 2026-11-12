import { actualKwFromReadings, capKw, roundKw } from './payout';

/**
 * Baseline = what the household would have used anyway.
 *
 * Photo path: kW measured in the rehearsal window at sign-up, with a sanity cap from the bill.
 */
export function photoBaselineKw(
  rehearsalBeforeKwh: number,
  rehearsalAfterKwh: number,
  hoursBetween: number,
  billAvgKwhMonth: number,
): number {
  const measured = actualKwFromReadings(rehearsalBeforeKwh, rehearsalAfterKwh, hoursBetween);
  return Math.min(measured, capKw(billAvgKwhMonth));
}

/**
 * Smart-meter path: average kW over the same hours on comparable past days.
 * Pass one average-kW figure per past day (already restricted to the window hours).
 */
export function amiBaselineKw(sameHoursKwOnPastDays: readonly number[]): number {
  if (sameHoursKwOnPastDays.length === 0) throw new RangeError('need at least one past day');
  const sum = sameHoursKwOnPastDays.reduce((a, b) => a + b, 0);
  return roundKw(sum / sameHoursKwOnPastDays.length);
}
