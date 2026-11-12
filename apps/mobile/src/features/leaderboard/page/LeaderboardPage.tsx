import { themes } from '@kapitwatt/styles';
import { radius, space } from '@kapitwatt/tokens';
import { Text } from '@kapitwatt/ui';
import { StyleSheet, View } from 'react-native';
import { ErrorState, Loading } from '@/components/ui';
import { TabScreen } from '@/layout/components/TabScreen';
import { ChaseCard } from '../components/ChaseCard';
import { Podium } from '../components/Podium';
import { RankRow } from '../components/RankRow';
import { useBarangayRanking } from '../hooks/useBarangayRanking';

const c = themes.light.color;

/**
 * Leaderboard, per barangay only (never per household, NFR-S4): the top three as a lantern
 * podium, how the household's barangay stands against the one around it, then the rest of the
 * ranking. The totals include simulated households, and the page says so.
 */
export default function LeaderboardPage() {
  const { board, refreshAll, mineId, podium, rest, chase } = useBarangayRanking();

  return (
    <TabScreen title="Leaderboard" overline="Barangays, by energy saved" onRefresh={refreshAll}>
      {board.isPending ? (
        <Loading />
      ) : board.isError ? (
        <ErrorState onRetry={() => void board.refetch()} />
      ) : (
        <>
          <Podium rows={podium} mineId={mineId} />
          {chase ? <ChaseCard headline={chase.headline} line={chase.line} /> : null}

          {rest.length > 0 ? (
            <View style={styles.list}>
              {rest.map((row, i) => (
                <RankRow
                  key={row.barangayId}
                  row={row}
                  isMine={row.barangayId === mineId}
                  divider={i < rest.length - 1}
                />
              ))}
            </View>
          ) : null}

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
    paddingHorizontal: space[4],
  },
});
