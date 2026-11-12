import type { HouseholdProfileRow } from '@kapitwatt/db';
import { HouseholdMe, MAX_COMMIT_KW } from '@kapitwatt/shared';
import { describe, expect, it } from 'vitest';
import { commitCapKw } from '../services/cap';
import { pathFor, toHouseholdMe } from '../services/households';

describe('commitCapKw', () => {
  it('is null until there is a baseline', () => {
    expect(commitCapKw(null, 450)).toBeNull();
  });

  it('is limited by the bill cap (worked example: 450 kWh/month caps at 1.25 kW, so 1.2)', () => {
    expect(commitCapKw(1.9, 450)).toBe(1.2);
  });

  it('is limited by the baseline', () => {
    expect(commitCapKw(0.8, 900)).toBe(0.8);
  });

  it('never exceeds MAX_COMMIT_KW', () => {
    expect(commitCapKw(9, 9000)).toBe(MAX_COMMIT_KW);
  });

  it('rounds down to the 0.1 kW step without float noise', () => {
    expect(commitCapKw(1.3, 1000)).toBe(1.3);
    expect(commitCapKw(0.7000000001, 1000)).toBe(0.7);
    expect(commitCapKw(0.05, 1000)).toBe(0);
  });
});

describe('household profile', () => {
  const row: HouseholdProfileRow = {
    id: '6f1e8a2e-3b7c-4c55-9a0e-0d6c1b8f2a10',
    barangayId: '9b2f6a3c-1d4e-4f5a-8b6c-7d8e9f0a1b2c',
    barangayName: 'Bagumbayan',
    municipality: 'Santa Cruz',
    meterType: 'standard',
    meterSerial: 'MER-123',
    billAvgKwhMonth: 450,
    baselineKw: null,
    trustScore: 50,
    optedIn: true,
    rehearsalReadings: 1,
    points: 160,
    creditPhp: 9.670000001,
  };

  it('maps meter type to verification path', () => {
    expect(pathFor('ami')).toBe('ami');
    expect(pathFor('standard')).toBe('photo');
  });

  it('asks photo households for the rehearsal until they have a baseline', () => {
    const me = HouseholdMe.parse(toHouseholdMe(row));
    expect(me.needsRehearsal).toBe(true);
    expect(me.commitCapKw).toBeNull();
    expect(me.creditPhp).toBe(9.67);
  });

  it('sets the commit cap once the baseline exists', () => {
    const me = toHouseholdMe({ ...row, baselineKw: 1.9 });
    expect(me.needsRehearsal).toBe(false);
    expect(me.commitCapKw).toBe(1.2);
  });

  it('never asks smart-meter households to rehearse', () => {
    expect(toHouseholdMe({ ...row, meterType: 'ami' }).needsRehearsal).toBe(false);
  });
});
