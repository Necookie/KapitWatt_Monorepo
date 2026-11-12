import type { AlertLevel } from '@kapitwatt/shared';

export const LEVELS: { level: AlertLevel; name: string; meaning: string }[] = [
  { level: 'red', name: 'Red alert', meaning: 'Reserves are short. Brownouts are possible.' },
  { level: 'yellow', name: 'Yellow alert', meaning: 'Supply is tight. Cuts ease the margin.' },
];
