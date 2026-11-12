import { contributionDelta, type MockHistoryItem } from '@kapitwatt/shared';
import { router } from 'expo-router';
import { useHistory, useRefreshAll } from '@/api/queries';
import { monthGroups } from '../utils/month-groups';
import { nightState } from '../utils/night-state';

/** How many past nights the summary strings as lanterns (the newest ones). */
const STRING_NIGHTS = 8;

/**
 * Past events for the lantern log: the summary (nights helped, kWh saved, the score they added),
 * the newest nights as lanterns oldest first, the nights by month, and opening one.
 */
export function useEventHistory() {
  const history = useHistory();
  const refreshAll = useRefreshAll();

  const items = history.data ?? [];
  const totals = items.reduce(
    (t, i) =>
      i.result
        ? {
            helped: t.helped + (nightState(i) === 'verified' ? 1 : 0),
            kwh: t.kwh + i.result.verifiedKwh,
            // The same rule settlement applies to the stored score.
            score: t.score + contributionDelta(i.result.zeroReason === null, i.result.zeroReason),
          }
        : t,
    { helped: 0, kwh: 0, score: 0 },
  );
  const string = items.slice(0, STRING_NIGHTS).reverse().map(nightState);
  const months = monthGroups(items);
  const openItem = (item: MockHistoryItem) =>
    router.push({
      pathname: item.result ? '/alert/[alertId]/result' : '/alert/[alertId]',
      params: { alertId: item.alert.id },
    });

  return { history, refreshAll, items, totals, string, months, openItem };
}
