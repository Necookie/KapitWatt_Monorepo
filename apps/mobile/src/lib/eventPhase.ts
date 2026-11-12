import type { MockAlertView } from '@kapitwatt/shared';

/** Where an event is from the household's point of view. Derived from server times and status. */
export type EventPhase = 'before_window' | 'window_open' | 'settling' | 'settled' | 'cancelled';

export function eventPhase(view: MockAlertView, now: number): EventPhase {
  const { status, windowStart, windowEnd } = view.alert;
  if (status === 'cancelled') return 'cancelled';
  if (status === 'settled') return 'settled';
  if (now < new Date(windowStart).getTime()) return 'before_window';
  if (now < new Date(windowEnd).getTime()) return 'window_open';
  return 'settling';
}

/** The moment the countdown on the event screen runs to, and what it is called. */
export function countdownTarget(
  view: MockAlertView,
  phase: EventPhase,
): { label: string; at: string } | null {
  switch (phase) {
    case 'before_window':
      return { label: 'Peak window starts in', at: view.alert.windowStart };
    case 'window_open':
      return { label: 'Peak window ends in', at: view.alert.windowEnd };
    case 'settling':
      return { label: 'Results in', at: view.settlesAt };
    default:
      return null;
  }
}
