import type { AlertRow, HouseholdCommitmentRow, HouseholdProfileRow } from '@kapitwatt/db';
import { describe, expect, it } from 'vitest';
import { commitRejection, liveReductionKw, photoDeadlines } from '../services/commit';
import { call, json } from './helpers';

const B1 = '11111111-1111-4111-8111-111111111111';
const at = (iso: string) => new Date(iso);

const household: HouseholdProfileRow = {
  id: 'h1',
  barangayId: B1,
  barangayName: 'Bagumbayan',
  municipality: 'Santa Cruz',
  meterType: 'standard',
  meterSerial: 'MER-1',
  billAvgKwhMonth: 450, // bill cap 1.25 kW
  baselineKw: 1.9, // commit cap 1.2 kW
  trustScore: 50,
  optedIn: true,
  rehearsalReadings: 2,
  points: 0,
  creditPhp: 0,
};

const alert: AlertRow = {
  id: 'a1',
  level: 'red',
  windowStart: at('2026-11-12T10:00:00Z'),
  windowEnd: at('2026-11-12T12:00:00Z'),
  targetKw: 600,
  targetBarangayIds: [B1],
  message: 'test',
  storedStatus: 'active',
  createdBy: 'operator',
  createdAt: at('2026-11-12T09:00:00Z'),
  clockOffsetSec: 0,
  pushSentAt: null,
  settledAt: null,
  cancelledAt: null,
  effectiveNow: at('2026-11-12T09:30:00Z'),
};

const code = (e: ReturnType<typeof commitRejection>) => e && [e.status, e.code];

describe('commitRejection', () => {
  it('accepts a valid commitment up to the cap', () => {
    expect(commitRejection(household, alert, 1)).toBeNull();
    expect(commitRejection(household, alert, 1.2)).toBeNull();
  });

  it('refuses a cut above the cap (worked example household: 1.2 kW)', () => {
    expect(code(commitRejection(household, alert, 1.3))).toEqual([422, 'above_cap']);
  });

  it('closes at window start, on the alert clock', () => {
    const started = { ...alert, effectiveNow: alert.windowStart };
    expect(code(commitRejection(household, started, 1))).toEqual([409, 'window_closed']);
  });

  it('needs the rehearsal first for photo households', () => {
    const fresh = { ...household, baselineKw: null };
    expect(code(commitRejection(fresh, alert, 1))).toEqual([409, 'needs_rehearsal']);
    expect(code(commitRejection({ ...fresh, meterType: 'ami' }, alert, 1))).toEqual([
      409,
      'no_baseline',
    ]);
  });

  it('only for targeted barangays, open alerts and opted-in households', () => {
    const elsewhere = { ...alert, targetBarangayIds: ['22222222-2222-4222-8222-222222222222'] };
    expect(code(commitRejection(household, elsewhere, 1))).toEqual([403, 'not_targeted']);
    expect(code(commitRejection(household, { ...alert, storedStatus: 'cancelled' }, 1))).toEqual([
      409,
      'alert_closed',
    ]);
    expect(code(commitRejection({ ...household, optedIn: false }, alert, 1))).toEqual([
      403,
      'opted_out',
    ]);
  });
});

describe('photoDeadlines', () => {
  it('opens at window start and end, closes 15 and 30 minutes later', () => {
    expect(photoDeadlines(alert.windowStart, alert.windowEnd)).toEqual({
      beforeOpensAt: '2026-11-12T10:00:00.000Z',
      beforeClosesAt: '2026-11-12T10:15:00.000Z',
      afterOpensAt: '2026-11-12T12:00:00.000Z',
      afterClosesAt: '2026-11-12T12:30:00.000Z',
    });
  });
});

describe('liveReductionKw', () => {
  const row: HouseholdCommitmentRow = {
    id: 'c1',
    alertId: 'a1',
    barangayId: B1,
    committedKw: 1,
    path: 'ami',
    baselineKw: 1.9,
    status: 'committed',
    actualKw: null,
    verifiedKwh: null,
    resultReason: null,
    windowStart: alert.windowStart,
    windowEnd: alert.windowEnd,
    effectiveNow: at('2026-11-12T11:00:00Z'),
    before: null,
    after: null,
    amiKwh: 1.1, // over 12 intervals = 1 h => 1.1 kW
    amiIntervals: 12,
  };

  it('is baseline minus measured kW during the window', () => {
    expect(liveReductionKw(row)).toBe(0.8);
  });

  it('is null outside the window, before data, and on the photo path', () => {
    expect(liveReductionKw({ ...row, effectiveNow: at('2026-11-12T09:00:00Z') })).toBeNull();
    expect(liveReductionKw({ ...row, amiIntervals: 0 })).toBeNull();
    expect(liveReductionKw({ ...row, path: 'photo' })).toBeNull();
  });

  it('never goes negative', () => {
    expect(liveReductionKw({ ...row, amiKwh: 3 })).toBe(0);
  });
});

describe('commitment routes (before the database)', () => {
  it('are household-only', async () => {
    expect((await call('/commitments/history')).status).toBe(401);
    expect((await call('/commitments', json({ alertId: B1, committedKw: 1 }))).status).toBe(401);
  });
});
