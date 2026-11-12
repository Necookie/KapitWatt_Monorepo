import { fontFamily } from '@kapitwatt/tokens';

/** Width of every plot's viewBox; plots stretch it to the panel width. */
export const W = 1000;
export const nonScaling = { vectorEffect: 'non-scaling-stroke' as const };

/** Font for SVG labels: the brand's Albert Sans, matching the type scale. */
export const svgFont = fontFamily.medium;

/** A rounded-up axis maximum on a 1, 2, 2.5, 4, 5, 6, 8 x 10^n ladder (each splits into 4 clean ticks). */
export function niceMax(value: number): number {
  if (value <= 0) return 1;
  const exp = 10 ** Math.floor(Math.log10(value));
  const f = value / exp;
  const step = [1, 2, 2.5, 4, 5, 6, 8, 10].find((s) => f <= s) ?? 10;
  return step * exp;
}

/** Evenly spaced axis ticks from 0 to max. */
export const ticks = (max: number, count = 4) =>
  Array.from({ length: count + 1 }, (_, i) => (max * i) / count);
