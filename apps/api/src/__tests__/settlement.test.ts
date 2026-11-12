import type { SettlementCommitmentRow } from '@kapitwatt/db';
import { describe, expect, it } from 'vitest';
import { computeSettlement, measureCommitment } from '../services/settlement';
import { call, OPERATOR_KEY } from './helpers';

const at = (iso: string) => new Date(iso);
const B1 = '11111111-1111-4111-8111-111111111111';
const B2 = '22222222-2222-4222-8222-222222222222';

/** The plan's worked example: window 18:00 to 20:00, committed 1 kW, baseline 1.9, bill 450. */
const photo: SettlementCommitmentRow = {
  id: 'c-photo',
  householdId: 'h1',
  barangayId: B1,
  path: 'photo',
  committedKw: 1,
  baselineKw: 1.9,
  billAvgKwhMonth: 450,
  before: { kwh: 1204.3, at: at('2026-11-12T10:04:00Z'), status: 'pass', flags: [] },
  after: { kwh: 1206.6, at: at('2026-11-12T12:10:00Z'), status: 'pass', flags: [] },
  amiKwh: 0,
  amiIntervals: 0,
};

/** The same cut measured by a smart meter: 24 intervals, 2.2 kWh = 1.1 kW. */
const ami: SettlementCommitmentRow = {
  ...photo,
  id: 'c-ami',
  householdId: 'h2',
  path: 'ami',
  before: null,
  after: null,
  amiKwh: 2.2,
  amiIntervals: 24,
};

describe('measureCommitment', () => {
  it('verifies the worked example: 1.1 kW measured, 0.8 kW cut, 1.6 kWh', () => {
    expect(measureCommitment(photo, 2)).toEqual({
      status: 'verified',
      actualKw: 1.1,
      paidCutKw: 0.8,
      verifiedKwh: 1.6,
      resultReason: null,
    });
    expect(measureCommitment(ami, 2).verifiedKwh).toBe(1.6);
  });

  it('pays nothing for a missing photo, and says why', () => {
    expect(measureCommitment({ ...photo, after: null }, 2)).toMatchObject({
      status: 'unverified',
      verifiedKwh: 0,
      resultReason: 'missing_photo',
    });
  });

  it('holds a flagged photo for review instead of paying it', () => {
    const flagged = {
      ...photo,
      after: { ...photo.after!, status: 'flagged' as const, flags: ['too_far' as const] },
    };
    expect(measureCommitment(flagged, 2)).toMatchObject({
      status: 'flagged',
      resultReason: 'failed_check',
    });
  });

  it('never pays a late or rejected photo', () => {
    const late = {
      ...photo,
      after: { ...photo.after!, status: 'flagged' as const, flags: ['late' as const] },
    };
    expect(measureCommitment(late, 2)).toMatchObject({
      status: 'unverified',
      resultReason: 'late_photo',
    });
    const rejected = { ...photo, before: { ...photo.before!, status: 'rejected' as const } };
    expect(measureCommitment(rejected, 2)).toMatchObject({
      status: 'unverified',
      resultReason: 'failed_check',
    });
  });

  it('flags smart-meter data with too many missing intervals', () => {
    expect(measureCommitment({ ...ami, amiIntervals: 18, amiKwh: 1.65 }, 2)).toMatchObject({
      status: 'flagged',
      resultReason: 'missing_ami_data',
    });
    expect(measureCommitment({ ...ami, amiIntervals: 20, amiKwh: 1.83 }, 2).status).toBe(
      'verified',
    );
  });

  it('marks a cut that measures zero as unverified', () => {
    const noCut = { ...photo, after: { ...photo.after!, kwh: 1209 } };
    expect(measureCommitment(noCut, 2)).toMatchObject({
      status: 'unverified',
      verifiedKwh: 0,
      resultReason: 'no_measured_cut',
    });
  });
});

describe('computeSettlement', () => {
  it('pays the worked example: PHP 8.06 + 1.61 bonus + 160 points; PHP 13.44 on a smart meter', () => {
    const { results, verifiedCount, deliveredKw } = computeSettlement(
      [photo, ami],
      [{ barangayId: B1, targetKw: 1.6 }],
      2,
    );
    expect(verifiedCount).toBe(2);
    expect(deliveredKw).toBe(1.6);
    expect(results.find((r) => r.id === 'c-photo')).toMatchObject({
      creditPhp: 8.06,
      bonusPhp: 1.61,
      points: 160,
    });
    expect(results.find((r) => r.id === 'c-ami')).toMatchObject({
      creditPhp: 13.44,
      bonusPhp: 2.69,
      points: 160,
    });
  });

  it('gives no bonus when the barangay misses its target', () => {
    const { results } = computeSettlement([photo], [{ barangayId: B1, targetKw: 5 }], 2);
    expect(results[0]).toMatchObject({ creditPhp: 8.06, bonusPhp: 0, points: 160 });
  });

  it('counts only verified cuts toward the target, and writes a zero row for the unpaid', () => {
    const missing = { ...photo, id: 'c-missing', after: null };
    const other = { ...photo, id: 'c-other', barangayId: B2 };
    const { results } = computeSettlement(
      [photo, missing, other],
      [
        { barangayId: B1, targetKw: 0.8 },
        { barangayId: B2, targetKw: 1 },
      ],
      2,
    );
    expect(results).toHaveLength(3);
    expect(results.find((r) => r.id === 'c-photo')?.bonusPhp).toBe(1.61);
    expect(results.find((r) => r.id === 'c-missing')).toMatchObject({
      creditPhp: 0,
      bonusPhp: 0,
      points: 0,
    });
    expect(results.find((r) => r.id === 'c-other')?.bonusPhp).toBe(0);
  });

  it('is deterministic: the same input settles the same way twice', () => {
    const input = [photo, ami, { ...photo, id: 'c3', after: null }];
    const targets = [{ barangayId: B1, targetKw: 1 }];
    expect(computeSettlement(input, targets, 2)).toEqual(computeSettlement(input, targets, 2));
  });
});

describe('settlement routes (before the database)', () => {
  const id = '11111111-1111-4111-8111-111111111111';
  it('settle and fast-forward are operator-only', async () => {
    expect((await call(`/alerts/${id}/settle`, { method: 'POST' })).status).toBe(401);
    expect((await call(`/alerts/${id}/fast-forward`, { method: 'POST' })).status).toBe(401);
  });

  it('fast-forward does not exist outside the demo environment', async () => {
    const { testEnv } = await import('./helpers');
    const res = await call(
      `/alerts/${id}/fast-forward`,
      {
        method: 'POST',
        headers: { 'x-operator-key': OPERATOR_KEY, 'content-type': 'application/json' },
        body: '{}',
      },
      testEnv({ APP_ENV: 'production' }),
    );
    expect(res.status).toBe(404);
  });

  it('results are household-only', async () => {
    expect((await call(`/rewards/by-alert/${id}`)).status).toBe(401);
    expect((await call('/rewards/summary')).status).toBe(401);
  });
});
