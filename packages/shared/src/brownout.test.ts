import { describe, expect, it } from 'vitest';
import { brownoutCopy, placeList } from './brownout';

describe('brownout wording', () => {
  it('names at-risk towns in reading order, once each', () => {
    expect(placeList([])).toBe('');
    expect(placeList(['Santa Cruz', 'Santa Cruz'])).toBe('Santa Cruz');
    expect(placeList(['Santa Cruz', 'Pila', 'Liliw'])).toBe('Santa Cruz, Pila and Liliw');
  });

  it('agrees with one town or several', () => {
    expect(brownoutCopy.atRisk('Santa Cruz')).toBe('Santa Cruz is at risk of a brownout tonight');
    expect(brownoutCopy.atRisk('Victoria and Nagcarlan')).toBe(
      'Victoria and Nagcarlan are at risk of a brownout tonight',
    );
  });
});
