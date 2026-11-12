import { StyleSheet, Text, View } from 'react-native';
import { ErrorState, Loading, Screen, SimulatedNote } from '@/components/ui';
import { formatKwh } from '@/lib/format';
import { useLeaderboard, useMe, useRefreshAll } from '@/lib/queries';
import { colors, fonts, radius, space, text } from '@/theme';

/** Barangay ranking (FR-APP-16). Per barangay only, never per household (NFR-S4). */
export default function LeaderboardScreen() {
  const board = useLeaderboard();
  const me = useMe();
  const refreshAll = useRefreshAll();

  if (board.isPending) return <Loading />;
  if (board.isError) return <ErrorState onRetry={() => void board.refetch()} />;

  const mine = me.data?.barangayId;

  return (
    <Screen onRefresh={refreshAll}>
      <Text style={styles.intro}>Barangays ranked by verified energy saved in the pilot.</Text>
      <View style={styles.list}>
        {board.data.map((row) => {
          const isMine = row.barangayId === mine;
          return (
            <View key={row.barangayId} style={[styles.row, isMine && styles.rowMine]}>
              <Text style={[styles.rank, isMine && styles.onDark]}>{row.rank}</Text>
              <View style={styles.name}>
                <Text style={[styles.title, isMine && styles.onDark]}>
                  {row.name}
                  {isMine ? ' (you)' : ''}
                </Text>
                <Text style={[styles.sub, isMine && styles.onDark]}>
                  {row.municipality} · {formatKwh(row.verifiedKwh)}
                </Text>
              </View>
              <Text style={[styles.points, isMine && styles.onDark]}>{row.points} pts</Text>
            </View>
          );
        })}
      </View>
      <SimulatedNote>Totals include simulated pilot households.</SimulatedNote>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { ...text.body, color: colors.muted },
  list: { gap: space.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  rowMine: { backgroundColor: colors.teal },
  rank: { ...text.title, color: colors.ink, width: 32, textAlign: 'center' },
  name: { flex: 1 },
  title: { ...text.body, fontFamily: fonts.semibold, color: colors.ink },
  sub: { ...text.caption, color: colors.muted },
  points: {
    ...text.body,
    fontFamily: fonts.semibold,
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  onDark: { color: colors.onDark },
});
