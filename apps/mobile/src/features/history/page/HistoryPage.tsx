import { MascotHeader } from '@/components/mascot/MascotHeader';
import { ErrorState, Loading } from '@/components/ui';
import { TabScreen } from '@/layout/components/TabScreen';
import { MonthSection } from '../components/MonthSection';
import { NightsCard } from '../components/NightsCard';
import { useEventHistory } from '../hooks/useEventHistory';

/**
 * History, the lantern log: the nights the household helped as lanterns on a string with what they
 * saved and the score they added, then every past night by month. A night opens its receipt (or
 * the event, while it waits for results).
 */
export default function HistoryPage() {
  const { history, refreshAll, items, totals, string, months, openItem } = useEventHistory();

  return (
    <TabScreen title="History" overline="Your grid events" onRefresh={refreshAll}>
      {history.isPending ? (
        <Loading />
      ) : history.isError ? (
        <ErrorState onRetry={() => void history.refetch()} />
      ) : items.length === 0 ? (
        <MascotHeader label="No events yet" line="Your past grid events will show up here." />
      ) : (
        <>
          <NightsCard
            helped={totals.helped}
            kwh={totals.kwh}
            score={totals.score}
            string={string}
          />
          {months.map((g) => (
            <MonthSection key={g.month} month={g.month} items={g.items} onOpen={openItem} />
          ))}
        </>
      )}
    </TabScreen>
  );
}
