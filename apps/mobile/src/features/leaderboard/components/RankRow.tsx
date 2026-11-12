import type { LeaderboardEntry } from '@kapitwatt/shared';
import { themes } from '@kapitwatt/styles';
import { Text } from '@kapitwatt/ui';
import { StyleSheet, View } from 'react-native';
import { fontFamily, space } from '@kapitwatt/tokens';
import { formatKwh } from '@/utils/format';
import { rankBadge } from '../utils/rank-badge';

const c = themes.light.color;

export function RankRow(props: { row: LeaderboardEntry; isMine: boolean; divider: boolean }) {
  const { row, isMine } = props;
  const badge = rankBadge(row.rank, isMine);
  return (
    <View style={[styles.row, props.divider && styles.divider]}>
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
          {row.municipality}
        </Text>
      </View>
      <Text variant="titleSmall" style={styles.tabular}>
        {formatKwh(row.verifiedKwh)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  strong: { fontFamily: fontFamily.bold },
  tabular: { fontVariant: ['tabular-nums'] },
  row: { flexDirection: 'row', alignItems: 'center', gap: space[3], paddingVertical: space[3] },
  divider: { borderBottomWidth: 1, borderBottomColor: c.outlineVariant },
  rank: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
