import { describe, expect, it } from 'vitest';
import { evaluatePhotoReading } from '../services/reading-checks';
import { registerPairToIntervals, simPhotoReadings } from '../services/sim-port';
import { call, json, SIM_KEY } from './helpers';

const window = { start: new Date('2026-11-12T10:00:00Z'), end: new Date('2026-11-12T12:00:00Z') };
const at = (minutesFromStart: number) =>
  new Date(window.start.getTime() + minutesFromStart * 60_000);

describe('evaluatePhotoReading', () => {
  const base = {
    kind: 'before' as const,
    readingKwh: 1204.3,
    capturedAt: at(4),
    window,
    previous: null,
    billAvgKwhMonth: 450,
    gps: null,
  };

  it('passes the worked example readings', () => {
    expect(evaluatePhotoReading(base)).toEqual({ checkStatus: 'pass', flags: [] });
    expect(
      evaluatePhotoReading({
        ...base,
        kind: 'after',
        readingKwh: 1206.6,
        capturedAt: at(130),
        previous: { kwh: 1204.3, at: at(4) },
      }),
    ).toEqual({ checkStatus: 'pass', flags: [] });
  });

  it('flags late photos on both sides of the window', () => {
    expect(evaluatePhotoReading({ ...base, capturedAt: at(16) }).flags).toEqual(['late']);
    expect(evaluatePhotoReading({ ...base, capturedAt: at(-1) }).flags).toEqual(['late']);
    expect(evaluatePhotoReading({ ...base, kind: 'after', capturedAt: at(151) }).flags).toEqual([
      'late',
    ]);
  });

  it('flags a falling or impossible reading', () => {
    const previous = { kwh: 1204.3, at: at(4) };
    expect(
      evaluatePhotoReading({
        ...base,
        kind: 'after',
        capturedAt: at(130),
        readingKwh: 1200,
        previous,
      }).flags,
    ).toEqual(['not_increasing']);
    expect(
      evaluatePhotoReading({
        ...base,
        kind: 'after',
        capturedAt: at(130),
        readingKwh: 1400,
        previous,
      }).flags,
    ).toEqual(['implausible_draw']);
  });

  it('flags a photo taken far from home and never times the rehearsal', () => {
    const far = { lat: 14.28, lng: 121.41, homeLat: 14.3, homeLng: 121.41 }; // about 2.2 km
    expect(evaluatePhotoReading({ ...base, gps: far }).flags).toEqual(['too_far']);
    expect(
      evaluatePhotoReading({ ...base, kind: 'rehearsal', window: null, capturedAt: at(500) }).flags,
    ).toEqual([]);
  });
});

describe('sim port conversions', () => {
  it('spreads a smart-meter register pair over 5-minute intervals', () => {
    const rows = registerPairToIntervals('h1', window, 1000, 1002.4);
    expect(rows).toHaveLength(24);
    expect(rows[0]).toEqual({
      householdId: 'h1',
      intervalStart: '2026-11-12T10:00:00.000Z',
      kwh: 0.1,
    });
    expect(rows.at(-1)?.intervalStart).toBe('2026-11-12T11:55:00.000Z');
    expect(rows.reduce((s, r) => s + r.kwh, 0)).toBeCloseTo(2.4);
  });

  it('refuses a register that went backwards', () => {
    expect(registerPairToIntervals('h1', window, 1000, 999)).toEqual([]);
  });

  it('times simulated photos from window start and judges them like a phone', () => {
    const rows = simPhotoReadings({ id: 'h1', billAvgKwhMonth: 450 }, window, [
      { kind: 'after', readingKwh: 1206.6, atMinute: 130 },
      { kind: 'before', readingKwh: 1204.3, atMinute: 4 },
    ]);
    expect(rows.map((r) => [r.kind, r.capturedAt, r.checkStatus])).toEqual([
      ['before', '2026-11-12T10:04:00.000Z', 'pass'],
      ['after', '2026-11-12T12:10:00.000Z', 'pass'],
    ]);
    const late = simPhotoReadings({ id: 'h1', billAvgKwhMonth: 450 }, window, [
      { kind: 'before', readingKwh: 1204.3, atMinute: 20 },
    ]);
    expect(late[0]?.flags).toEqual(['late']);
  });
});

describe('sim routes (before the database)', () => {
  it('validate the run body', async () => {
    const res = await call('/sim/run', json({ alertId: 'nope' }, { 'x-sim-key': SIM_KEY }));
    expect(res.status).toBe(400);
  });
});
