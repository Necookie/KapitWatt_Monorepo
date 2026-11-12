import type { AlertStatus } from '@kapitwatt/shared';
import type { ChipTone } from '@kapitwatt/ui';

/** Where an alert stands. Red and yellow stay reserved for the NGCP level, so no status uses them. */
export const STATUS: Record<AlertStatus, { label: string; tone: ChipTone }> = {
  scheduled: { label: 'Scheduled', tone: 'neutral' },
  active: { label: 'Commits open', tone: 'primary' },
  window_open: { label: 'Window open', tone: 'primary' },
  settling: { label: 'Measuring', tone: 'accent' },
  settled: { label: 'Settled', tone: 'relief' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
};

export const IN_PROGRESS: AlertStatus[] = ['scheduled', 'active', 'window_open', 'settling'];
