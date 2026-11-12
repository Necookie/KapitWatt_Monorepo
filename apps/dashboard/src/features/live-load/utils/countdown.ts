import type { AlertStatus } from '@kapitwatt/shared';
import { PHOTO_RULES } from '@kapitwatt/shared';
import type { DashboardAlert } from '@/api/client';

const MIN = 60_000;

/** What the countdown counts to at each stage; null once settled. */
export function countdownFor(alert: DashboardAlert, status: AlertStatus) {
  const start = new Date(alert.windowStart).getTime();
  const end = new Date(alert.windowEnd).getTime();
  switch (status) {
    case 'scheduled':
    case 'active':
      return { label: 'Window opens in', at: start };
    case 'window_open':
      return { label: 'Window ends in', at: end };
    case 'settling':
      return { label: 'After photos due in', at: end + PHOTO_RULES.afterDeadlineMin * MIN };
    default:
      return null;
  }
}
