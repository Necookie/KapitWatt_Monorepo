import { describe, expect, it } from 'vitest';
import { TOTAL_SIMULATED_HOUSEHOLDS } from './data/laguna';
import { expectedOutcome } from './forecast';
import { DEFAULT_PARAMS } from './presets';

describe('demo numbers from the plan', () => {
  it('seeds 1,200 households', () => {
    expect(TOTAL_SIMULATED_HOUSEHOLDS).toBe(1200);
  });

  it('720 kW committed, about 527 kW delivered (88% of a 600 kW target)', () => {
    const o = expectedOutcome(TOTAL_SIMULATED_HOUSEHOLDS, DEFAULT_PARAMS);
    expect(o.committedKw).toBeCloseTo(720);
    expect(Math.round(o.deliveredAmiKw)).toBe(86);
    expect(Math.round(o.deliveredPhotoKw)).toBe(441);
    expect(Math.round(o.deliveredKw)).toBe(527);
    expect(Math.round((o.deliveredKw / 600) * 100)).toBe(88);
  });

  it('applies a separate follow-through to photo households when one is set', () => {
    const o = expectedOutcome(TOTAL_SIMULATED_HOUSEHOLDS, {
      ...DEFAULT_PARAMS,
      photoFollowThrough: 0.5,
    });
    expect(Math.round(o.deliveredAmiKw)).toBe(86);
    // 720 x 85% x 50% x 90%
    expect(o.deliveredPhotoKw).toBeCloseTo(275.4);
  });
});
