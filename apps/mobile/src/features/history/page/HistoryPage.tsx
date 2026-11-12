import { Text } from '@kapitwatt/ui';
import { StyleSheet, View } from 'react-native';
import { MascotHeader } from '@/components/mascot/MascotHeader';
import { ErrorState, Loading, Screen } from '@/components/ui';
import { formatKwh } from '@/utils/format';
import { space } from '@/styles/theme';
import { HistoryCard } from '../components/HistoryCard';
import { Tile } from '../components/Tile';
import { useEventHistory } from '../hooks/useEventHistory';

/** Past events and their results (FR-APP-16; mockup "History"). */
export default function HistoryPage() {
  const { history, refreshAll, items, totals, openItem } = useEventHistory();

  if (history.isPending) return <Loading />;
  if (history.isError) return <ErrorState onRetry={() => void history.refetch()} />;

  return (
    <Screen roomy noHeader onRefresh={refreshAll}>
      <Text variant="headlineSmall">History</Text>

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
    </Screen>
  );
}

const styles = StyleSheet.create({
  tiles: { flexDirection: 'row', gap: space.sm },
});
