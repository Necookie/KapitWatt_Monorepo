import { REWARD } from '../constants';
import type { VerificationPath } from '../schemas/enums';

/**
 * Baseline and payout math from the plan (section 6). Used by the API for real
 * households and by the simulator for simulated ones, so both settle identically.
 *
 *   actual_kw    = (reading_after - reading_before) / hours between the two readings
 *   cut_kw       = max(0, baseline_kw - actual_kw)
 *   cap_kw       = peakFactor x (bill_avg_kwh_month / 720)
 *   paid_cut_kw  = min(cut_kw, committed_kw, cap_kw)
 *   verified_kwh = paid_cut_kw x window hours
 *   credit_php   = verified_kwh x rate x path multiplier
 *   bonus_php    = 20% of credit_php if the barangay reached its target
 *   points       = 100 x verified_kwh
 */

const round = (value: number, decimals: number): number => {
  const f = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * f) / f;
};

/**
 * kW values are kept to 0.1 kW, which is how the plan's worked example rounds
 * (2.3 kWh over 2.1 h = 1.1 kW). Meter readings are only good to 0.1 kWh.
 */
export const roundKw = (kw: number): number => round(kw, 1);
export const roundPhp = (php: number): number => round(php, 2);

/** Measured load between two meter readings. Uses the real elapsed time, not the scheduled window. */
export function actualKwFromReadings(
  readingBeforeKwh: number,
  readingAfterKwh: number,
  hoursBetween: number,
): number {
  if (hoursBetween <= 0) throw new RangeError('hoursBetween must be positive');
  return roundKw((readingAfterKwh - readingBeforeKwh) / hoursBetween);
}

/** Sanity cap from bill history: the most a household could plausibly cut. */
export function capKw(billAvgKwhMonth: number): number {
  return REWARD.peakFactor * (billAvgKwhMonth / REWARD.hoursPerMonth);
}

export interface VerifyCutInput {
  baselineKw: number;
  actualKw: number;
  committedKw: number;
  billAvgKwhMonth: number;
  /** Scheduled window length. Pay is for the scheduled window, not the elapsed time between photos. */
  windowHours: number;
}

export interface VerifiedCut {
  cutKw: number;
  paidCutKw: number;
  verifiedKwh: number;
}

export function verifyCut(input: VerifyCutInput): VerifiedCut {
  const cutKw = roundKw(Math.max(0, input.baselineKw - input.actualKw));
  const paidCutKw = Math.min(cutKw, input.committedKw, capKw(input.billAvgKwhMonth));
  return { cutKw, paidCutKw, verifiedKwh: round(paidCutKw * input.windowHours, 3) };
}

export interface RewardResult {
  creditPhp: number;
  bonusPhp: number;
  points: number;
}

/**
 * Run after every commitment in the barangay is verified, because the bonus
 * depends on whether the barangay as a whole reached its target.
 * No verified cut means no credit and no bonus.
 */
export function computeReward(
  verifiedKwh: number,
  path: VerificationPath,
  barangayTargetHit: boolean,
): RewardResult {
  const credit = verifiedKwh * REWARD.ratePhpPerKwh * REWARD.pathMultiplier[path];
  return {
    creditPhp: roundPhp(credit),
    bonusPhp: barangayTargetHit ? roundPhp(credit * REWARD.barangayBonusRate) : 0,
    points: Math.round(verifiedKwh * REWARD.pointsPerKwh),
  };
}
