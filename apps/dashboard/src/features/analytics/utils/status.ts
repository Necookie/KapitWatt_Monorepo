import type { AlertStatus } from '@kapitwatt/shared';
import type { ChipTone } from '@kapitwatt/ui';

export const STATUS: Record<AlertStatus, { label: string; tone: ChipTone }> = {
  scheduled: { label: 'Scheduled', tone: 'neutral' },
  active: { label: 'Taking commitments', tone: 'primary' },
  window_open: { label: 'Window open', tone: 'primary' },
  settling: { label: 'Settling', tone: 'neutral' },
  settled: { label: 'Settled', tone: 'relief' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
};
