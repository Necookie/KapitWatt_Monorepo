import { useLeaderboard, useMe, useRefreshAll } from '@/api/queries';
import { chase } from '../utils/chase';

/**
 * The barangay ranking split for the page: the top three for the podium, the rest for the list,
 * the household's own barangay, and the chase line about the one around it.
 */
export function useBarangayRanking() {
  const board = useLeaderboard();
  const me = useMe();
  const refreshAll = useRefreshAll();

  const rows = board.data ?? [];
  const mineId = me.data?.barangayId;

  return {
    board,
    refreshAll,
    mineId,
    podium: rows.slice(0, 3),
    rest: rows.slice(3),
    chase: chase(rows, mineId),
  };
}
