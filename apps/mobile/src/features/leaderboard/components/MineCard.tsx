import type { LeaderboardEntry } from '@kapitwatt/shared';
import { themes } from '@kapitwatt/styles';
import { Text } from '@kapitwatt/ui';
import { StyleSheet, View } from 'react-native';
import { formatKwh } from '@/utils/format';
import { radius, space } from '@/styles/theme';

const c = themes.light.color;

export function MineCard(props: { row: LeaderboardEntry }) {
  const mine = props.row;
  return (
    <View style={styles.mineCard}>
      <Text variant="titleLarge" style={{ color: c.onPrimaryContainer }}>
        {`#${mine.rank}`}
      </Text>
      <View style={styles.flex}>
        <Text variant="titleMedium" style={{ color: c.onPrimaryContainer }}>
          {`${mine.name} (you)`}
        </Text>
        <Text variant="bodySmall" style={{ color: c.onPrimaryContainer }}>
          {mine.municipality}
        </Text>
      </View>
      <Text variant="titleSmall" style={[styles.tabular, { color: c.onPrimaryContainer }]}>
        {formatKwh(mine.verifiedKwh)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  tabular: { fontVariant: ['tabular-nums'] },
  mineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.lg,
    backgroundColor: c.primaryContainer,
  },
});
