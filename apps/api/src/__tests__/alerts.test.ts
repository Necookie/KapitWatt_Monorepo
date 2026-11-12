import type { AlertTargetRow, TotalsCommitmentRow } from '@kapitwatt/db';
import { AlertTotals } from '@kapitwatt/shared';
import { describe, expect, it } from 'vitest';
import { deriveAlertStatus } from '../services/alert-view';
import { alertTitle, buildMessages, sendExpo } from '../services/push';
import { computeTotals, deliveredKw } from '../services/totals';
import { call, json, OPERATOR_KEY } from './helpers';

const at = (iso: string) => new Date(iso);
const B1 = '11111111-1111-4111-8111-111111111111';
const B2 = '22222222-2222-4222-8222-222222222222';

describe('deriveAlertStatus', () => {
  const start = at('2026-11-12T10:00:00Z');
  const end = at('2026-11-12T12:00:00Z');

  it('follows the window on the alert clock', () => {
    expect(deriveAlertStatus('active', start, end, at('2026-11-12T09:59:00Z'))).toBe('active');
    expect(deriveAlertStatus('active', start, end, at('2026-11-12T10:00:00Z'))).toBe('window_open');
    expect(deriveAlertStatus('active', start, end, at('2026-11-12T12:00:00Z'))).toBe('settling');
  });

  it('keeps terminal and in-progress states as stored', () => {
    expect(deriveAlertStatus('settled', start, end, at('2026-11-12T09:00:00Z'))).toBe('settled');
    expect(deriveAlertStatus('cancelled', start, end, at('2026-11-12T11:00:00Z'))).toBe(
      'cancelled',
    );
    expect(deriveAlertStatus('settling', start, end, at('2026-11-12T11:00:00Z'))).toBe('settling');
  });
});

/** The plan's worked example as a commitment row. */
const workedExample: TotalsCommitmentRow = {
  id: 'c1',
  barangayId: B1,
  path: 'photo',
  status: 'committed',
  committedKw: 1,
  baselineKw: 1.9,
  billAvgKwhMonth: 450,
  verifiedKwh: null,
  before: { kwh: 1204.3, at: at('2026-11-12T18:04:00Z'), status: 'pass' },
  after: { kwh: 1206.6, at: at('2026-11-12T20:10:00Z'), status: 'pass' },
  amiKwh: 0,
  amiIntervals: 0,
};

describe('deliveredKw', () => {
  it('counts a photo cut once both photos passed (worked example: 0.8 kW)', () => {
    expect(deliveredKw(workedExample, 2)).toBe(0.8);
  });

  it('counts nothing until the after photo passed', () => {
    expect(deliveredKw({ ...workedExample, after: null }, 2)).toBe(0);
    expect(
      deliveredKw({ ...workedExample, after: { ...workedExample.after!, status: 'flagged' } }, 2),
    ).toBe(0);
  });

  it('measures smart-meter households from intervals so far', () => {
    // 12 intervals = 1 hour, 1.1 kWh => 1.1 kW actual, baseline 1.9 => 0.8 kW cut
    const ami = { ...workedExample, path: 'ami' as const, before: null, after: null };
    expect(deliveredKw({ ...ami, amiKwh: 1.1, amiIntervals: 12 }, 2)).toBe(0.8);
    expect(deliveredKw(ami, 2)).toBe(0);
  });

  it('uses the settled result once settled', () => {
    expect(deliveredKw({ ...workedExample, status: 'verified', verifiedKwh: 1.6 }, 2)).toBe(0.8);
    expect(deliveredKw({ ...workedExample, status: 'unverified' }, 2)).toBe(0);
  });
});

describe('computeTotals', () => {
  const targets: AlertTargetRow[] = [
    {
      barangayId: B1,
      name: 'Bagumbayan',
      municipality: 'Santa Cruz',
      targetKw: 0.8,
      isOverride: false,
    },
    { barangayId: B2, name: 'Calios', municipality: 'Santa Cruz', targetKw: 1, isOverride: false },
  ];

  const input = {
    alertId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
    targetKw: 1.8,
    windowHours: 2,
    status: 'window_open' as const,
    targets,
    optedIn: { [B1]: 40, [B2]: 50 },
  };

  it('sums committed and delivered per barangay and marks targets hit', () => {
    const totals = AlertTotals.parse(
      computeTotals({
        ...input,
        commitments: [workedExample, { ...workedExample, id: 'c2', barangayId: B2, after: null }],
      }),
    );
    expect(totals.committedKw).toBe(2);
    expect(totals.deliveredKw).toBe(0.8);
    expect(totals.status).toBe('window_open');
    expect(totals.committedHouseholds).toBe(2);
    expect(
      totals.barangays.map((b) => [b.committedKw, b.deliveredKw, b.targetHit, b.households]),
    ).toEqual([
      [1, 0.8, true, 40],
      [1, 0, false, 50],
    ]);
  });

  it('splits delivered kW by path, and the parts add up to the total', () => {
    const ami: TotalsCommitmentRow = {
      ...workedExample,
      id: 'c3',
      path: 'ami',
      before: null,
      after: null,
      amiKwh: 1.1,
      amiIntervals: 12,
    };
    const totals = computeTotals({ ...input, commitments: [workedExample, ami] });
    expect(totals.deliveredAmiKw).toBe(0.8);
    expect(totals.deliveredPhotoKw).toBe(0.8);
    expect(totals.deliveredKw).toBe(1.6);
    const [b1] = totals.barangays;
    expect(b1!.deliveredAmiKw! + b1!.deliveredPhotoKw!).toBeCloseTo(b1!.deliveredKw);
  });
});

describe('push', () => {
  const alert = {
    id: 'a1',
    level: 'red' as const,
    windowStart: at('2026-11-12T10:00:00Z'), // 18:00 in Manila
    windowEnd: at('2026-11-12T12:00:00Z'),
    message: 'Please cut load',
  };

  it('titles the alert in Manila time', () => {
    expect(alertTitle(alert)).toBe('Red alert: cut load 18:00 to 20:00');
  });

  it('batches by 100 and clears unregistered tokens', async () => {
    const tokens = Array.from({ length: 150 }, (_, i) => `ExponentPushToken[t${i}]`);
    const sizes: number[] = [];
    const fakeFetch = (async (_url: string, init: RequestInit) => {
      const batch = JSON.parse(init.body as string) as { to: string }[];
      sizes.push(batch.length);
      return new Response(
        JSON.stringify({
          data: batch.map((m) =>
            m.to === 'ExponentPushToken[t3]'
              ? { status: 'error', details: { error: 'DeviceNotRegistered' } }
              : { status: 'ok', id: m.to },
          ),
        }),
      );
    }) as unknown as typeof fetch;
    const out = await sendExpo(buildMessages(alert, tokens), undefined, fakeFetch);
    expect(sizes).toEqual([100, 50]);
    expect(out).toEqual({ sent: 149, failed: 1, unregistered: ['ExponentPushToken[t3]'] });
  });

  it('counts a failed batch without throwing', async () => {
    const down = (async () => new Response('down', { status: 503 })) as unknown as typeof fetch;
    const out = await sendExpo(buildMessages(alert, ['ExponentPushToken[x]']), 'tok', down);
    expect(out).toEqual({ sent: 0, failed: 1, unregistered: [] });
  });
});

describe('alert routes (before the database)', () => {
  const op = { 'x-operator-key': OPERATOR_KEY };
  const alertBody = {
    level: 'red',
    windowStart: '2030-01-01T10:00:00.000Z',
    windowEnd: '2030-01-01T12:00:00.000Z',
    targetKw: 600,
    targetBarangayIds: [],
    message: 'test',
  };

  it('rejects non-UUID ids', async () => {
    expect((await call('/alerts/not-a-uuid')).status).toBe(400);
    expect((await call('/alerts/not-a-uuid/totals')).status).toBe(400);
  });

  it('rejects a malformed Idempotency-Key', async () => {
    const res = await call('/alerts', json(alertBody, { ...op, 'idempotency-key': 'bad key!' }));
    expect(res.status).toBe(400);
  });

  it('rejects a malformed token on /alerts/active instead of ignoring it', async () => {
    const res = await call('/alerts/active', { headers: { authorization: 'Bearer nope' } });
    expect(res.status).toBe(401);
  });

  it('shows no alert to a phone that is not signed in (no barangay, no consent yet)', async () => {
    const res = await call('/alerts/active');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ alert: null });
  });

  it('keeps the alert log operator-only', async () => {
    expect((await call('/alerts')).status).toBe(401);
  });
});
