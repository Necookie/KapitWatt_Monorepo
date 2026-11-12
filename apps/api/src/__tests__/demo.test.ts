import type { SettlementCommitmentRow } from '@kapitwatt/db';
import { SimParams } from '@kapitwatt/shared';
import { describe, expect, it } from 'vitest';
import {
  DEMO_COMMIT_KW,
  demoActualKw,
  demoPhotoReadings,
  outcomeFor,
  PAST_EVENTS,
  pastWindowStart,
  usageBetween,
  type DemoOutcome,
} from '../services/demo';
import { forecastLiveEvent, type ForecastHousehold } from '../services/demo-forecast';
import { measureCommitment } from '../services/settlement';
import { simPhotoReadings } from '../services/sim-port';

const window = { start: new Date('2026-11-12T10:00:00Z'), end: new Date('2026-11-12T12:00:00Z') };

describe('pastWindowStart', () => {
  it('lands on the hour, Manila time, the given number of days back', () => {
    // 11:00 in Manila on 12 November.
    const now = new Date('2026-11-12T03:00:00Z');
    expect(pastWindowStart(now, 2, 14).toISOString()).toBe('2026-11-10T06:00:00.000Z');
    expect(pastWindowStart(now, 27, 18).toISOString()).toBe('2026-10-16T10:00:00.000Z');
  });

  it('counts days by the Manila calendar, not UTC', () => {
    // 04:00 on 13 November in Manila, still 12 November in UTC.
    const now = new Date('2026-11-12T20:00:00Z');
    expect(pastWindowStart(now, 1, 14).toISOString()).toBe('2026-11-12T06:00:00.000Z');
  });
});

describe('PAST_EVENTS', () => {
  it('runs oldest first, inside four weeks, all in the past', () => {
    const days = PAST_EVENTS.map((e) => e.daysAgo);
    expect(days).toEqual([...days].sort((a, b) => b - a));
    expect(Math.max(...days)).toBeLessThanOrEqual(28);
    expect(Math.min(...days)).toBeGreaterThanOrEqual(1);
  });

  it('scripts every demo account that can commit, with known outcomes', () => {
    for (const e of PAST_EVENTS) {
      expect(e.demo).toHaveLength(DEMO_COMMIT_KW.length);
      for (let i = 0; i < e.demo.length; i++) expect(() => outcomeFor(e, i)).not.toThrow();
      // Demo accounts live in Santa Cruz: every past event must reach them.
      expect(e.towns === 'all' || e.towns.includes('Santa Cruz')).toBe(true);
    }
  });

  it('shows each kind of result at least once, and smart meters only pay or skip', () => {
    const seen = new Set<DemoOutcome>();
    for (const e of PAST_EVENTS) {
      for (let i = 0; i < e.demo.length; i++) seen.add(outcomeFor(e, i));
      // Accounts 08 and 09 are on smart meters.
      for (const i of [7, 8]) expect(['paid', 'skip']).toContain(outcomeFor(e, i));
    }
    expect([...seen].sort()).toEqual(['flagged', 'late', 'missed', 'paid', 'skip']);
  });
});

describe('demo photo outcomes, through the real checks and settlement', () => {
  const household = { id: 'h1', billAvgKwhMonth: 450 };
  const settle = (outcome: Exclude<DemoOutcome, 'skip'>) => {
    const readings = simPhotoReadings(
      household,
      window,
      demoPhotoReadings(outcome, {
        startKwh: 3204.3,
        actualKw: demoActualKw(1.9, 1, 0.9),
        windowMinutes: 120,
      }),
      { kwh: 3100, at: new Date('2026-11-05T12:00:00Z') },
    );
    const pick = (kind: 'before' | 'after') => {
      const r = readings.find((x) => x.kind === kind);
      return r
        ? { kwh: r.readingKwh, at: new Date(r.capturedAt), status: r.checkStatus, flags: r.flags }
        : null;
    };
    const row: SettlementCommitmentRow = {
      id: 'c1',
      householdId: 'h1',
      barangayId: 'b1',
      path: 'photo',
      committedKw: 1,
      baselineKw: 1.9,
      billAvgKwhMonth: 450,
      before: pick('before'),
      after: pick('after'),
      amiKwh: 0,
      amiIntervals: 0,
    };
    return { readings, measured: measureCommitment(row, 2) };
  };

  it('paid: both photos pass and the cut is verified', () => {
    const { readings, measured } = settle('paid');
    expect(readings.map((r) => r.checkStatus)).toEqual(['pass', 'pass']);
    expect(measured.status).toBe('verified');
    expect(measured.verifiedKwh).toBeGreaterThan(1.5);
  });

  it('late: the after photo is flagged late and nothing is paid', () => {
    const { readings, measured } = settle('late');
    expect(readings[1]!.flags).toEqual(['late']);
    expect(measured).toMatchObject({ status: 'unverified', resultReason: 'late_photo' });
  });

  it('missed: no after photo, nothing paid', () => {
    expect(settle('missed').measured).toMatchObject({
      status: 'unverified',
      resultReason: 'missing_photo',
    });
  });

  it('flagged: a falling reading waits for a person to review it', () => {
    const { readings, measured } = settle('flagged');
    expect(readings[1]!.flags).toEqual(['not_increasing']);
    expect(measured).toMatchObject({ status: 'flagged', resultReason: 'failed_check' });
  });

  it('the before reading passes against the previous event', () => {
    expect(usageBetween(450, 5)).toBe(75);
    expect(usageBetween(450, -1)).toBe(0);
  });
});

describe('forecastLiveEvent', () => {
  const households = (trustScore: number): ForecastHousehold[] =>
    Array.from({ length: 40 }, (_, i) => ({
      id: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
      barangayId: i < 20 ? 'b1' : 'b2',
      meterType: i % 7 === 0 ? 'ami' : 'standard',
      baselineKw: 1.8,
      billAvgKwhMonth: 450,
      lastReadingKwh: 4000,
      trustScore,
    }));
  const targets = [
    { barangayId: 'b1', targetKw: 10 },
    { barangayId: 'b2', targetKw: 10 },
  ];
  const params = SimParams.parse({ seed: 7, participation: 0.6 });

  it('is repeatable for a seed and delivers less than it commits', async () => {
    const a = await forecastLiveEvent(households(50), targets, params, window);
    const b = await forecastLiveEvent(households(50), targets, params, window);
    expect(a).toEqual(b);
    expect(a.committedKw).toBeGreaterThan(0);
    expect(a.deliveredKw).toBeGreaterThan(0);
    expect(a.deliveredKw).toBeLessThan(a.committedKw);
    expect(a.barangays.map((x) => x.barangayId)).toEqual(['b1', 'b2']);
  });

  it('applies the trust cap as the database does: a 1 kW commit above it is refused', async () => {
    // Trust 0 halves the cap: min(1.8, 1.25) x 0.5 = 0.6 kW, under the default 1 kW cut.
    const f = await forecastLiveEvent(households(0), targets, params, window);
    expect(f.committedKw).toBe(0);
    expect(f.deliveredKw).toBe(0);
  });
});
