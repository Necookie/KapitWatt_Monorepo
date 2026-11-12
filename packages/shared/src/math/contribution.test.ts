import { describe, expect, it } from 'vitest';
import { CONTRIBUTION_BANDS, TRUST } from '../constants';
import { contributionDelta, contributionStanding } from './contribution';

describe('contribution score', () => {
  it('starts a new account in the first band with perks', () => {
    const s = contributionStanding(TRUST.start);
    expect(s.band.name).toBe('Kislap');
    expect(s.band.extraPayDays).toBe(3);
    expect(s.next?.name).toBe('Ningas');
    expect(s.toNext).toBe(25);
  });

  it('moves up a band at its minimum score and stops at the top', () => {
    expect(contributionStanding(49.99).band.name).toBe('Kislap');
    expect(contributionStanding(50).band.name).toBe('Ningas');
    expect(contributionStanding(89).toNext).toBe(1);
    const top = contributionStanding(TRUST.max);
    expect(top.band.name).toBe('Tala');
    expect(top.next).toBeNull();
    expect(top.toNext).toBe(0);
  });

  it('pauses the perks below the starting score', () => {
    const s = contributionStanding(TRUST.start + TRUST.flaggedReading);
    expect(s.band.name).toBe('Paused');
    expect(s.band.extraPayDays).toBe(0);
    expect(s.toNext).toBe(10);
  });

  it('keeps the bands in rising order, each perk no worse than the band below', () => {
    for (let i = 1; i < CONTRIBUTION_BANDS.length; i++) {
      const low = CONTRIBUTION_BANDS[i - 1]!;
      const high = CONTRIBUTION_BANDS[i]!;
      expect(high.minScore).toBeGreaterThan(low.minScore);
      expect(high.extraPayDays).toBeGreaterThan(low.extraPayDays);
      expect(high.depositRefundMonths).toBeLessThan(low.depositRefundMonths);
      expect(high.feeDiscount).toBeGreaterThan(low.feeDiscount);
      expect(high.partnerDiscount).toBeGreaterThan(low.partnerDiscount);
      expect(high.raffleEntries).toBeGreaterThan(low.raffleEntries);
    }
  });

  it('rises with a verified cut, falls with a flag or a missed photo, and ignores the rest', () => {
    expect(contributionDelta(true, null)).toBe(TRUST.cleanEvent);
    expect(contributionDelta(false, 'failed_check')).toBe(TRUST.flaggedReading);
    expect(contributionDelta(false, 'missing_photo')).toBe(TRUST.missedEvent);
    expect(contributionDelta(false, 'late_photo')).toBe(TRUST.missedEvent);
    expect(contributionDelta(false, 'missing_ami_data')).toBe(0);
    expect(contributionDelta(false, 'no_measured_cut')).toBe(0);
  });
});
