import type { LeaderboardEntry } from '@kapitwatt/shared';
import { formatKwh } from '@/utils/format';

/**
 * The household's barangay against the one around it: how far it leads the next one, or how much
 * it needs to pass the one ahead. Null when its barangay is not on the board.
 */
export function chase(
  board: LeaderboardEntry[],
  mineId: string | undefined,
): { headline: string; line: string } | null {
  const i = board.findIndex((r) => r.barangayId === mineId);
  if (i < 0) return null;
  const mine = board[i]!;
  if (i === 0) {
    const next = board[1];
    return {
      headline: next
        ? `${mine.name} leads by ${formatKwh(mine.verifiedKwh - next.verifiedKwh)}`
        : `${mine.name} leads the pilot`,
      line: 'Every verified cut keeps it in front.',
    };
  }
  const ahead = board[i - 1]!;
  const gap = ahead.verifiedKwh - mine.verifiedKwh;
  return {
    headline: gap > 0 ? `${formatKwh(gap)} to pass ${ahead.name}` : `Tied with ${ahead.name}`,
    line: `${mine.name} is number ${mine.rank}. Every verified cut moves it up.`,
  };
}
