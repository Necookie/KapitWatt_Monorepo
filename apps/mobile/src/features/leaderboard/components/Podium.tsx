import type { LeaderboardEntry } from '@kapitwatt/shared';
import { themes } from '@kapitwatt/styles';
import { space, withAlpha } from '@kapitwatt/tokens';
import { Text } from '@kapitwatt/ui';
import { StyleSheet, View } from 'react-native';
import { Lantern } from '@/components/night/Lantern';
import { formatKwh } from '@/utils/format';

const c = themes.light.color;
/** Lantern height: the smallest, and how much taller the leader's is (px). */
const MIN = 40;
const GROW = 34;
/** The strings: second and third hang lower than the leader, in podium order. */
const STRING = { 1: 10, 2: 22, 3: 30 } as Record<number, number>;

/**
 * The top three barangays as lanterns on a wire, in podium order (second, first, third), each sized
 * by the energy it saved against the leader's. The household's own barangay has a ring and "You".
 * Rank and kWh are written under each lantern, so size is never the only signal.
 */
export function Podium({ rows, mineId }: { rows: LeaderboardEntry[]; mineId?: string }) {
  const top = rows[0]?.verifiedKwh || 1;
  const order = [rows[1], rows[0], rows[2]].filter((r): r is LeaderboardEntry => !!r);
  return (
    <View style={styles.podium}>
      <View style={styles.wire} />
      {order.map((row) => {
        const size = MIN + GROW * (row.verifiedKwh / top);
        const mine = row.barangayId === mineId;
        return (
          <View
            key={row.barangayId}
            style={styles.place}
            accessible
            accessibilityLabel={`Number ${row.rank}, ${row.name}, ${row.municipality}, ${formatKwh(row.verifiedKwh)}${mine ? ', your barangay' : ''}`}
          >
            <View style={[styles.cord, { height: STRING[row.rank] ?? 20 }]} />
            <View style={[styles.slot, { height: MIN + GROW }]}>
              {mine ? (
                <View
                  style={[
                    styles.ring,
                    {
                      // Centred on the lantern's body (half its height).
                      top: size * 0.05,
                      width: size * 0.9,
                      height: size * 0.9,
                      borderRadius: size * 0.45,
                    },
                  ]}
                />
              ) : null}
              <View style={styles.front}>
                <Lantern height={size} />
              </View>
            </View>
            <Text variant="titleSmall" numberOfLines={1} align="center">
              {row.name}
            </Text>
            <Text variant="bodySmall" color="onSurfaceVariant" style={styles.tabular}>
              {`#${row.rank} · ${formatKwh(row.verifiedKwh)}`}
            </Text>
            {mine ? (
              <Text variant="labelSmall" color="primary" style={styles.you}>
                YOU
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabular: { fontVariant: ['tabular-nums'] },
  podium: { flexDirection: 'row', alignItems: 'flex-start', marginTop: space[3], paddingTop: 2 },
  wire: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 2,
    height: 1.5,
    backgroundColor: c.outlineVariant,
  },
  place: { flex: 1, alignItems: 'center', gap: 2, paddingHorizontal: space[1] },
  cord: { width: 1, backgroundColor: c.outlineVariant },
  slot: { alignItems: 'center', justifyContent: 'flex-start' },
  // Above its ring (on the web a positioned ring would otherwise paint over it).
  front: { zIndex: 1 },
  ring: { position: 'absolute', backgroundColor: withAlpha(c.primary, 0.14) },
  you: { letterSpacing: 0.5 },
});
