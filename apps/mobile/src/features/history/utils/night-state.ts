import type { MockHistoryItem } from '@kapitwatt/shared';

/** A past night: its cut was verified (paid), it still waits for results, or it paid nothing. */
export type NightState = 'verified' | 'waiting' | 'unpaid';

export const nightState = (item: MockHistoryItem): NightState =>
  !item.result ? 'waiting' : item.result.verifiedKwh > 0 ? 'verified' : 'unpaid';
