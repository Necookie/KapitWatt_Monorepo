import type { MockHistoryItem } from '@kapitwatt/shared';

export interface MonthGroup {
  /** "November 2026" */
  month: string;
  items: MockHistoryItem[];
}

/** Past nights grouped by the month of their window, in the order given (newest first). */
export function monthGroups(items: MockHistoryItem[]): MonthGroup[] {
  const groups: MonthGroup[] = [];
  for (const item of items) {
    const month = new Date(item.alert.windowStart).toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    });
    const last = groups[groups.length - 1];
    if (last && last.month === month) last.items.push(item);
    else groups.push({ month, items: [item] });
  }
  return groups;
}
