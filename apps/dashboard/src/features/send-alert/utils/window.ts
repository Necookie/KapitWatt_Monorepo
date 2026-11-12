import { inMinutes, tonightAt } from './alert-defaults';

export const HOUR = 3_600_000;

export const PRESETS = [
  { key: 'tonight', label: 'Tonight 6 PM', at: () => tonightAt(18) },
  { key: '10m', label: 'In 10 min', at: () => inMinutes(10) },
  { key: '1h', label: 'In 1 h', at: () => inMinutes(60) },
] as const;
