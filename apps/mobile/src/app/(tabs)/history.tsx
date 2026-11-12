import { themes } from '@kapitwatt/styles';
import { Text } from '@kapitwatt/ui';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { AlertBadge } from '@/components/event/AlertBadge';
import { MascotHeader } from '@/components/mascot/MascotHeader';
import { ErrorState, Loading, Screen } from '@/components/ui';
import { formatKw, formatKwh, formatPhp, formatWindow } from '@/lib/format';
import { useHistory, useRefreshAll } from '@/lib/queries';
import { radius, space } from '@/theme';

const c = themes.light.color;

const dateLabel = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

/** Past events and their results (FR-APP-16; mockup "History"). */
export default function HistoryScreen() {
  const history = useHistory();
  const refreshAll = useRefreshAll();

  if (history.isPending) return <Loading />;
  if (history.isError) return <ErrorState onRetry={() => void history.refetch()} />;

  const items = history.data;
  const totals = items.reduce(
    (t, i) =>
      i.result
        ? {
            points: t.points + i.result.points,
            php: t.php + i.result.creditPhp + i.result.bonusPhp,
            kwh: t.kwh + i.result.verifiedKwh,
          }
        : t,
    { points: 0, php: 0, kwh: 0 },
  );

  return (
    <Screen roomy noHeader onRefresh={refreshAll}>
      <Text variant="headlineSmall">History</Text>

      <View style={styles.tiles}>
        <Tile label="Points" value={String(totals.points)} accent />
        <Tile label="Earned" value={formatPhp(totals.php)} />
        <Tile label="Saved" value={formatKwh(totals.kwh)} />
      </View>

      {items.length === 0 ? (
        <MascotHeader label="No events yet" line="Your past grid events will show up here." />
      ) : null}

      {items.map((item) => {
        const r = item.result;
        const paid = r ? r.verifiedKwh > 0 : false;
        return (
          <Pressable
            key={item.alert.id}
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: r ? '/alert/[alertId]/result' : '/alert/[alertId]',
                params: { alertId: item.alert.id },
              })
            }
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          >
            <View style={styles.cardTop}>
              <AlertBadge level={item.alert.level} />
              <Text variant="bodySmall" color="onSurfaceVariant" style={styles.tabular}>
                {`${dateLabel(item.alert.windowStart)} · ${formatWindow(item.alert.windowStart, item.alert.windowEnd)}`}
              </Text>
            </View>
            <View style={styles.cardBottom}>
              <View style={styles.flex}>
                <Text variant="bodyMedium" color="onSurfaceVariant">
                  {r
                    ? `Committed ${formatKw(item.committedKw)} · verified ${formatKwh(r.verifiedKwh)}`
                    : `Committed ${formatKw(item.committedKw)}`}
                </Text>
                <Text
                  variant="titleSmall"
                  color={!r ? 'onSurfaceVariant' : paid ? 'relief' : 'error'}
                >
                  {!r ? 'Waiting for results' : paid ? 'Verified' : 'No payout'}
                </Text>
              </View>
              {r ? (
                <View style={styles.amount}>
                  <Text variant="titleMedium" style={styles.tabular}>
                    {formatPhp(r.creditPhp + r.bonusPhp)}
                  </Text>
                  <Text variant="bodySmall" color="tertiary">
                    {`${r.points} pts`}
                  </Text>
                </View>
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </Screen>
  );
}

function Tile(props: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={[styles.tile, props.accent && { backgroundColor: c.brandAccent }]}>
      <Text
        variant="bodySmall"
        style={{ color: props.accent ? c.onBrandAccent : c.onSurfaceVariant }}
      >
        {props.label}
      </Text>
      <Text
        variant="titleLarge"
        style={[styles.tabular, { color: props.accent ? c.onBrandAccent : c.onSurface }]}
      >
        {props.value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  tabular: { fontVariant: ['tabular-nums'] },
  tiles: { flexDirection: 'row', gap: space.sm },
  tile: {
    flex: 1,
    gap: 2,
    padding: space.md,
    borderRadius: radius.lg,
    backgroundColor: c.surfaceContainerLow,
  },
  card: {
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: c.outlineVariant,
    backgroundColor: c.surfaceContainerLowest,
  },
  pressed: { backgroundColor: c.surfaceContainerLow },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardBottom: { flexDirection: 'row', alignItems: 'flex-end', gap: space.md },
  amount: { alignItems: 'flex-end' },
});
