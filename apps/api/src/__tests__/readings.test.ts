import { MAX_PHOTO_BYTES } from '@kapitwatt/shared';
import { describe, expect, it } from 'vitest';
import { AppError } from '../lib/errors';
import { assertValidPhoto, isJpeg } from '../services/photos';
import { photoWindowState } from '../services/readings';
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
