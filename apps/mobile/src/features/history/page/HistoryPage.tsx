import { StyleSheet, View } from 'react-native';
import { MascotHeader } from '@/components/mascot/MascotHeader';
import { ErrorState, Loading } from '@/components/ui';
import { TabScreen } from '@/layout/components/TabScreen';
import { formatKwh } from '@/utils/format';
import { space } from '@/styles/theme';
import { HistoryCard } from '../components/HistoryCard';
import { Tile } from '../components/Tile';
import { useEventHistory } from '../hooks/useEventHistory';

/** Past events and their results (FR-APP-16; mockup "History"). */
export default function HistoryPage() {
  const { history, refreshAll, items, totals, openItem } = useEventHistory();

  return (
    <TabScreen title="History" overline="Your grid events" onRefresh={refreshAll}>
      {history.isPending ? (
        <Loading />
      ) : history.isError ? (
        <ErrorState onRetry={() => void history.refetch()} />
      ) : (
        <>
          <View style={styles.tiles}>
            <Tile label="Verified cuts" value={String(totals.verified)} accent />
            <Tile label="Events" value={String(items.length)} />
            <Tile label="Saved" value={formatKwh(totals.kwh)} />
          </View>

          {items.length === 0 ? (
            <MascotHeader label="No events yet" line="Your past grid events will show up here." />
          ) : null}

          {items.map((item) => (
            <HistoryCard key={item.alert.id} item={item} onOpen={() => openItem(item)} />
          ))}
        </>
      )}
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  tiles: { flexDirection: 'row', gap: space.sm },
});
