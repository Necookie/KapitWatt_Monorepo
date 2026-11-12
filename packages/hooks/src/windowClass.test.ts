import { describe, expect, it } from 'vitest';
import { windowClassFor } from './windowClass';

describe('windowClassFor', () => {
  it.each([
    [375, 'compact'],
    [600, 'medium'],
    [839, 'medium'],
    [840, 'expanded'],
    [1280, 'large'],
    [1920, 'extraLarge'],
  ] as const)('%i px is %s', (w, cls) => {
    expect(windowClassFor(w)).toBe(cls);
  });
});
