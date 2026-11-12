import { describe, expect, it } from 'vitest';
import { countdown } from './countdown';

describe('countdown', () => {
  const t0 = Date.UTC(2026, 10, 12, 18, 0, 0);
  it('formats minutes and seconds under an hour', () => {
    expect(countdown(t0 + 9 * 60_000 + 5_000, t0).label).toBe('09:05');
  });
  it('adds hours for a two-hour peak window', () => {
    expect(countdown(t0 + 2 * 3_600_000, t0)).toMatchObject({
      hours: 2,
      minutes: 0,
      seconds: 0,
      label: '2:00:00',
    });
  });
  it('rounds part seconds up so 0.4 s left still shows 00:01', () => {
    expect(countdown(t0 + 400, t0).label).toBe('00:01');
  });
  it('stops at zero and reports done', () => {
    expect(countdown(t0, t0 + 5_000)).toMatchObject({ msLeft: 0, done: true, label: '00:00' });
  });
});
