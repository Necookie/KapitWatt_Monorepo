import { CreateAlertInput, TRUST } from '@kapitwatt/shared';
import { describe, expect, it } from 'vitest';
import { commitCapKw, trustMultiplier } from '../services/cap';
import { trustDelta } from '../services/settlement';
import { call, json, OPERATOR_KEY } from './helpers';

describe('trust score', () => {
  it('only narrows the cap below neutral', () => {
    expect(trustMultiplier(TRUST.start)).toBe(1);
    expect(trustMultiplier(100)).toBe(1);
    expect(trustMultiplier(0)).toBe(0.5);
    expect(commitCapKw(1.9, 450, 50)).toBe(1.2);
    expect(commitCapKw(1.9, 450, 20)).toBe(0.8); // 1.25 x 0.7 = 0.875
    expect(commitCapKw(1.9, 450, 0)).toBe(0.6);
  });

  it('rises with a clean event and falls with a flagged reading or a missed photo', () => {
    expect(trustDelta({ status: 'verified', resultReason: null })).toBe(TRUST.cleanEvent);
    expect(trustDelta({ status: 'flagged', resultReason: 'failed_check' })).toBe(
      TRUST.flaggedReading,
    );
    expect(trustDelta({ status: 'unverified', resultReason: 'missing_photo' })).toBe(
      TRUST.missedEvent,
    );
    expect(trustDelta({ status: 'unverified', resultReason: 'late_photo' })).toBe(
      TRUST.missedEvent,
    );
  });

  it('is not moved by things outside the household', () => {
    expect(trustDelta({ status: 'flagged', resultReason: 'missing_ami_data' })).toBe(0);
    expect(trustDelta({ status: 'unverified', resultReason: 'no_measured_cut' })).toBe(0);
  });
});

describe('scheduled alerts', () => {
  const base = {
    level: 'red',
    windowStart: '2030-01-01T10:00:00.000Z',
    windowEnd: '2030-01-01T12:00:00.000Z',
    targetKw: 600,
    targetBarangayIds: [],
    message: 'test',
  };

  it('must be sent before the window starts', () => {
    expect(
      CreateAlertInput.safeParse({ ...base, sendAt: '2030-01-01T09:00:00.000Z' }).success,
    ).toBe(true);
    expect(
      CreateAlertInput.safeParse({ ...base, sendAt: '2030-01-01T10:30:00.000Z' }).success,
    ).toBe(false);
  });
});

describe('review and cancel routes (before the database)', () => {
  const id = '11111111-1111-4111-8111-111111111111';
  const op = { 'x-operator-key': OPERATOR_KEY };

  it('are operator-only', async () => {
    expect((await call('/readings/flagged')).status).toBe(401);
    expect((await call(`/readings/${id}/review`, json({ decision: 'approve' }))).status).toBe(401);
    expect((await call(`/alerts/${id}/cancel`, { method: 'POST' })).status).toBe(401);
  });

  it('validate the decision and the id', async () => {
    expect((await call(`/readings/${id}/review`, json({ decision: 'maybe' }, op))).status).toBe(
      400,
    );
    expect((await call('/readings/nope/review', json({ decision: 'approve' }, op))).status).toBe(
      400,
    );
  });
});
