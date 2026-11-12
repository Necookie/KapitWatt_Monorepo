import { breakpoint, type WindowClass } from '@kapitwatt/tokens';

const order = Object.entries(breakpoint).sort((a, b) => b[1] - a[1]) as [WindowClass, number][];

/** Material 3 window size class for a window width in dp. */
export function windowClassFor(width: number): WindowClass {
  return order.find(([, min]) => width >= min)?.[0] ?? 'compact';
}
