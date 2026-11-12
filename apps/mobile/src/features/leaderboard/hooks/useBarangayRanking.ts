import { useLeaderboard, useMe, useRefreshAll } from '@/api/queries';

/** The barangay ranking and the household's own barangay in it. */
export function useBarangayRanking() {
  const board = useLeaderboard();
  const me = useMe();
  const refreshAll = useRefreshAll();

  const mineId = me.data?.barangayId;
  const mine = board.data?.find((r) => r.barangayId === mineId);

  return { board, refreshAll, mineId, mine };
}
