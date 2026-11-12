import type { AlertLevel } from '@kapitwatt/shared';

export type Stage = 'all' | 'progress' | 'settled' | 'cancelled';

export const LEVELS: { value: AlertLevel | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'red', label: 'Red' },
  { value: 'yellow', label: 'Yellow' },
];
export const STAGES: { value: Stage; label: string }[] = [
  { value: 'progress', label: 'In progress' },
  { value: 'settled', label: 'Settled' },
  { value: 'cancelled', label: 'Cancelled' },
];
