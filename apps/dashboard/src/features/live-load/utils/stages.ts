import type { AlertStatus } from '@kapitwatt/shared';

/** The four stages the operator walks an event through. */
export const STAGES = ['Sent', 'Window open', 'Measuring', 'Settled'] as const;

export function stageIndex(status: AlertStatus): number {
  switch (status) {
    case 'scheduled':
    case 'active':
      return 0;
    case 'window_open':
      return 1;
    case 'settling':
      return 2;
    case 'settled':
      return 3;
    case 'cancelled':
      return -1;
  }
}

/** One line on what the operator and households can do at this stage. */
export function stageHint(status: AlertStatus): string {
  switch (status) {
    case 'scheduled':
    case 'active':
      return 'Households can commit until the window opens.';
    case 'window_open':
      return 'Commits are closed. Photo households take the before photo now.';
    case 'settling':
      return 'Window ended. After photos are due; delivered load fills as readings pass their checks.';
    case 'settled':
      return 'Results are final. Credits, points and barangay bonuses have been issued.';
    case 'cancelled':
      return 'This alert was cancelled.';
  }
}
