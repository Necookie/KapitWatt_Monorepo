import { describe, expect, it } from 'vitest';
import { actualKwFromReadings, capKw, computeReward, verifyCut } from './payout';

/** The worked example from the plan: one photo household, window 18:00 to 20:00, committed 1.0 kW. */
describe('plan worked example', () => {
  const actualKw = actualKwFromReadings(1204.3, 1206.6, 2.1); // 18:04 to 20:10
  const cut = verifyCut({
    baselineKw: 1.9,
    actualKw,
    committedKw: 1.0,
    billAvgKwhMonth: 450,
    windowHours: 2,
  });

  it('measures 1.1 kW and a 0.8 kW cut', () => {
    expect(actualKw).toBe(1.1);
    expect(capKw(450)).toBe(1.25);
    expect(cut).toEqual({ cutKw: 0.8, paidCutKw: 0.8, verifiedKwh: 1.6 });
  });

  it('pays a photo household PHP 8.06 + PHP 1.61 bonus + 160 points', () => {
    expect(computeReward(cut.verifiedKwh, 'photo', true)).toEqual({
      creditPhp: 8.06,
      bonusPhp: 1.61,
      points: 160,
    });
  });

  it('pays a smart-meter household PHP 13.44 for the same cut', () => {
    expect(computeReward(cut.verifiedKwh, 'ami', false)).toEqual({
      creditPhp: 13.44,
      bonusPhp: 0,
      points: 160,
    });
  });
});

describe('verifyCut', () => {
  const base = { baselineKw: 3, committedKw: 1, billAvgKwhMonth: 450, windowHours: 2 };

  it('never pays more than the commitment', () => {
    expect(verifyCut({ ...base, actualKw: 1 }).paidCutKw).toBe(1);
  });

  it('never pays more than the bill cap', () => {
    expect(verifyCut({ ...base, committedKw: 2, actualKw: 0.5 }).paidCutKw).toBe(1.25);
  });

  it('pays nothing when consumption did not drop', () => {
    expect(verifyCut({ ...base, actualKw: 3.4 }).verifiedKwh).toBe(0);
  });
});
