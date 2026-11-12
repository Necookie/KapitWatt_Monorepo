import { MOON_OUTER } from '@/components/night/Moon';

export const STROKE = 8;
/** The progress ring takes the place of the moon's ring of light, just outside it. */
export const SIZE = MOON_OUTER + STROKE * 2;
export const R = (SIZE - STROKE) / 2;
export const C = 2 * Math.PI * R;
