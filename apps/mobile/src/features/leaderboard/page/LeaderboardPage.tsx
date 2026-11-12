import { themes } from '@kapitwatt/styles';
import { Text } from '@kapitwatt/ui';
import { StyleSheet, View } from 'react-native';
import { ErrorState, Loading } from '@/components/ui';
import { TabScreen } from '@/layout/components/TabScreen';
import { radius, space } from '@/styles/theme';
import { MineCard } from '../components/MineCard';
import { RankRow } from '../components/RankRow';
import { useBarangayRanking } from '../hooks/useBarangayRanking';

const c = themes.light.color;

/** Barangay ranking (FR-APP-16; mockup "Leaderboard"). Per barangay only, never per household (NFR-S4). */
export default function LeaderboardPage() {
  const { board, refreshAll, mineId, mine } = useBarangayRanking();

  return (
    <TabScreen title="Leaderboard" overline="Barangays, by energy saved" onRefresh={refreshAll}>
      {board.isPending ? (
        <Loading />
      ) : board.isError ? (
        <ErrorState onRetry={() => void board.refetch()} />
      ) : (
        <>
          {mine ? <MineCard row={mine} /> : null}

          <View style={styles.list}>
            {board.data.map((row, i) => (
              <RankRow
                key={row.barangayId}
                row={row}
                isMine={row.barangayId === mineId}
                divider={i < board.data.length - 1}
              />
            ))}
          </View>

          <Text variant="bodySmall" color="onSurfaceVariant" align="center">
            Totals include simulated pilot households.
          </Text>
        </>
      )}
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  list: {
    borderRadius: radius.lg,
    backgroundColor: c.surfaceContainerLow,
    paddingHorizontal: space.lg,
  },
});
