import { themes } from '@kapitwatt/styles';
import { Text } from '@kapitwatt/ui';
import { StyleSheet, View } from 'react-native';
import { ErrorState, Loading, Screen } from '@/components/ui';
import { formatKwh } from '@/lib/format';
import { useLeaderboard, useMe, useRefreshAll } from '@/lib/queries';
import { fonts, radius, space } from '@/theme';

const c = themes.light.color;

/** Barangay ranking (FR-APP-16; mockup "Leaderboard"). Per barangay only, never per household (NFR-S4). */
export default function LeaderboardScreen() {
  const board = useLeaderboard();
  const me = useMe();
  const refreshAll = useRefreshAll();

  if (board.isPending) return <Loading />;
  if (board.isError) return <ErrorState onRetry={() => void board.refetch()} />;

  const mineId = me.data?.barangayId;
  const mine = board.data.find((r) => r.barangayId === mineId);

  return (
    <Screen roomy noHeader onRefresh={refreshAll}>
      <View style={styles.heading}>
        <Text variant="headlineSmall">Leaderboard</Text>
        <Text variant="bodyMedium" color="onSurfaceVariant">
          Barangays, by energy saved
        </Text>
      </View>

      {mine ? (
        <View style={styles.mineCard}>
          <Text variant="titleLarge" style={{ color: c.onPrimaryContainer }}>
            {`#${mine.rank}`}
          </Text>
          <View style={styles.flex}>
            <Text variant="titleMedium" style={{ color: c.onPrimaryContainer }}>
              {`${mine.name} (you)`}
            </Text>
            <Text variant="bodySmall" style={{ color: c.onPrimaryContainer }}>
              {`${mine.municipality} · ${formatKwh(mine.verifiedKwh)}`}
            </Text>
          </View>
          <Text variant="titleSmall" style={[styles.tabular, { color: c.onPrimaryContainer }]}>
            {`${mine.points} pts`}
          </Text>
        </View>
      ) : null}

      <View style={styles.list}>
        {board.data.map((row, i) => {
          const isMine = row.barangayId === mineId;
          const badge = isMine
            ? { bg: c.primary, fg: c.onPrimary }
            : row.rank === 1
              ? { bg: c.brandAccent, fg: c.onBrandAccent }
              : row.rank === 2
                ? { bg: c.tertiaryContainer, fg: c.onTertiaryContainer }
                : { bg: c.surfaceContainerHigh, fg: c.onSurfaceVariant };
          return (
            <View
              key={row.barangayId}
              style={[styles.row, i < board.data.length - 1 && styles.divider]}
            >
              <View style={[styles.rank, { backgroundColor: badge.bg }]}>
                <Text variant="titleSmall" style={{ color: badge.fg }}>
                  {String(row.rank)}
                </Text>
              </View>
              <View style={styles.flex}>
                <Text variant="titleSmall" style={isMine ? styles.strong : undefined}>
                  {isMine ? `${row.name} (you)` : row.name}
                </Text>
                <Text variant="bodySmall" color="onSurfaceVariant">
                  {`${row.municipality} · ${formatKwh(row.verifiedKwh)}`}
                </Text>
              </View>
              <Text variant="titleSmall" style={styles.tabular}>
                {`${row.points} pts`}
              </Text>
            </View>
          );
        })}
      </View>

      <Text variant="bodySmall" color="onSurfaceVariant" align="center">
        Totals include simulated pilot households.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  strong: { fontFamily: fonts.bold },
  tabular: { fontVariant: ['tabular-nums'] },
  heading: { gap: 2 },
  mineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.lg,
    backgroundColor: c.primaryContainer,
  },
  list: {
    borderRadius: radius.lg,
    backgroundColor: c.surfaceContainerLow,
    paddingHorizontal: space.lg,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  divider: { borderBottomWidth: 1, borderBottomColor: c.outlineVariant },
  rank: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
