import type { ReadingHousehold } from '@kapitwatt/db';
import { COMMIT_STEP_KW, MAX_PHOTO_BYTES } from '@kapitwatt/shared';
import { describe, expect, it } from 'vitest';
import { AppError } from '../lib/errors';
import { assertValidPhoto, isJpeg } from '../services/photos';
import { isSameUpload, photoWindowState, prepareRehearsal } from '../services/readings';
import { call, OPERATOR_KEY } from './helpers';

const start = new Date('2026-11-12T10:00:00Z');
const end = new Date('2026-11-12T12:00:00Z');
const minutesFrom = (base: Date, m: number) => new Date(base.getTime() + m * 60_000);

describe('photoWindowState', () => {
  it('opens the before photo at window start for 15 minutes', () => {
    expect(photoWindowState('before', minutesFrom(start, -1), start, end)).toBe('not_open_yet');
    expect(photoWindowState('before', start, start, end)).toBe('open');
    expect(photoWindowState('before', minutesFrom(start, 15), start, end)).toBe('open');
    expect(photoWindowState('before', minutesFrom(start, 15.1), start, end)).toBe(
      'deadline_passed',
    );
  });

  it('opens the after photo at window end for 30 minutes', () => {
    expect(photoWindowState('after', minutesFrom(end, -1), start, end)).toBe('not_open_yet');
    expect(photoWindowState('after', minutesFrom(end, 30), start, end)).toBe('open');
    expect(photoWindowState('after', minutesFrom(end, 31), start, end)).toBe('deadline_passed');
  });
});

describe('photo validation', () => {
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);

  it('recognises JPEG by its bytes, not its name', () => {
    expect(isJpeg(jpeg)).toBe(true);
    expect(isJpeg(new TextEncoder().encode('\x89PNG....'))).toBe(false);
    expect(isJpeg(new Uint8Array())).toBe(false);
  });

  it('rejects non-JPEG and oversized files with distinct codes', () => {
    const code = (bytes: Uint8Array) => {
      try {
        assertValidPhoto(bytes);
        return 'ok';
      } catch (e) {
        return (e as AppError).code;
      }
    };
    expect(code(jpeg)).toBe('ok');
    expect(code(new Uint8Array([1, 2, 3, 4]))).toBe('invalid_photo');
    const big = new Uint8Array(MAX_PHOTO_BYTES + 1);
    big.set([0xff, 0xd8, 0xff]);
    expect(code(big)).toBe('photo_too_large');
  });
});

describe('reading routes (before the database)', () => {
  it('need a household to upload', async () => {
    expect((await call('/readings', { method: 'POST', body: new FormData() })).status).toBe(401);
  });

  it('keep photos operator-only and validate the id', async () => {
    const id = '11111111-1111-4111-8111-111111111111';
    expect((await call(`/readings/${id}/photo`)).status).toBe(401);
    const bad = await call('/readings/nope/photo', { headers: { 'x-operator-key': OPERATOR_KEY } });
    expect(bad.status).toBe(400);
  });
});

describe('rehearsal baseline', () => {
  const first = new Date('2026-11-12T08:00:00Z');
  const household = (kwh: number): ReadingHousehold => ({
    meterType: 'standard',
    baselineKw: null,
    billAvgKwhMonth: 450,
    lat: null,
    lng: null,
    previous: { kwh, at: first },
    rehearsal: [{ kwh, at: first }],
  });
  const second = (readingKwh: number) =>
    ({ kind: 'rehearsal', readingKwh, lat: 14.27, lng: 121.41 }) as const;

  it('refuses a second reading that has not moved, so the household can take it again', () => {
    expect(() => prepareRehearsal(household(1204), second(1204), minutesFrom(first, 30))).toThrow(
      expect.objectContaining({ status: 422, code: 'rehearsal_too_low' }),
    );
  });

  it('sets a baseline the household can commit against', () => {
    const prepared = prepareRehearsal(household(1204), second(1205), minutesFrom(first, 60));
    expect(prepared.baselineKw).toBeGreaterThanOrEqual(COMMIT_STEP_KW);
  });
});

describe('resending a photo', () => {
  const alertId = '3f1c2b9e-1d2a-4c3b-9e8f-0a1b2c3d4e5f';
  const stored = { householdId: 'h1', kind: 'before' as const, alertId };

  it('treats the same household, kind and alert as a resend', () => {
    expect(isSameUpload(stored, 'h1', { kind: 'before', alertId })).toBe(true);
    expect(
      isSameUpload({ householdId: 'h1', kind: 'rehearsal', alertId: null }, 'h1', {
        kind: 'rehearsal',
      }),
    ).toBe(true);
  });

  it('treats anything else as a reused photo', () => {
    expect(isSameUpload(stored, 'h2', { kind: 'before', alertId })).toBe(false);
    expect(isSameUpload(stored, 'h1', { kind: 'after', alertId })).toBe(false);
    expect(isSameUpload(stored, 'h1', { kind: 'before', alertId: crypto.randomUUID() })).toBe(
      false,
    );
  });
});

describe('rehearsal baseline for a very small household', () => {
  it('accepts a real reading even when the bill cap keeps the baseline under one step', () => {
    const first = new Date('2026-11-12T08:00:00Z');
    const prepared = prepareRehearsal(
      {
        meterType: 'standard',
        baselineKw: null,
        billAvgKwhMonth: 30,
        lat: null,
        lng: null,
        previous: { kwh: 100, at: first },
        rehearsal: [{ kwh: 100, at: first }],
      },
      { kind: 'rehearsal', readingKwh: 101, lat: 14.27, lng: 121.41 },
      minutesFrom(first, 240),
    );
    expect(prepared.baselineKw).toBeLessThan(COMMIT_STEP_KW);
  });
});
