import type { MockHistoryItem } from '@kapitwatt/shared';
import { router } from 'expo-router';
import { useHistory, useRefreshAll } from '@/api/queries';

/** Past events, their totals for the tiles, and opening one. */
export function useEventHistory() {
  const history = useHistory();
  const refreshAll = useRefreshAll();

  const items = history.data ?? [];
  const totals = items.reduce(
    (t, i) =>
      i.result
        ? {
            verified: t.verified + (i.result.verifiedKwh > 0 ? 1 : 0),
            kwh: t.kwh + i.result.verifiedKwh,
          }
        : t,
    { verified: 0, kwh: 0 },
  );
  const openItem = (item: MockHistoryItem) =>
    router.push({
      pathname: item.result ? '/alert/[alertId]/result' : '/alert/[alertId]',
      params: { alertId: item.alert.id },
    });

  return { history, refreshAll, items, totals, openItem };
}
