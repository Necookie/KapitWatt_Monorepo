import type { MockHistoryItem } from '@kapitwatt/shared';
import { themes } from '@kapitwatt/styles';
import { space, stateLayer, withAlpha } from '@kapitwatt/tokens';
import { Text } from '@kapitwatt/ui';
import { Pressable, StyleSheet, View } from 'react-native';
import { formatKwh, formatWindow } from '@/utils/format';
import { dateLabel } from '../utils/date-label';
import { nightState } from '../utils/night-state';
import { NightLantern } from './NightLantern';

const c = themes.light.color;

/**
 * One past night in the log: its lantern, the date with the alert level in words and the window,
 * and what it saved (or that it waits for results, or paid nothing). Opens the night's receipt.
 */
export function NightRow(props: { item: MockHistoryItem; last: boolean; onOpen: () => void }) {
  const { item } = props;
  const state = nightState(item);
  const level = item.alert.level === 'red' ? 'Red alert' : 'Yellow alert';
  const when = `${level} · ${formatWindow(item.alert.windowStart, item.alert.windowEnd)}`;
  const saved = formatKwh(item.result?.verifiedKwh ?? 0);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${dateLabel(item.alert.windowStart)}, ${when}. ${
        state === 'verified'
          ? `${saved} saved`
          : state === 'waiting'
            ? 'Waiting for results'
            : 'Not verified'
      }`}
      onPress={props.onOpen}
      style={({ pressed }) => [
        styles.row,
        !props.last && styles.divider,
        pressed && { backgroundColor: withAlpha(c.onSurface, stateLayer.pressed) },
      ]}
    >
      <NightLantern state={state} size={26} ink={c.onSurfaceVariant} />
      <View style={styles.words}>
        <Text variant="titleSmall">{dateLabel(item.alert.windowStart)}</Text>
        <Text variant="bodySmall" color="onSurfaceVariant" style={styles.tabular}>
          {when}
        </Text>
      </View>
      {state === 'verified' ? (
        <Text variant="titleSmall" style={styles.tabular}>
          {saved}
        </Text>
      ) : state === 'waiting' ? (
        <Text variant="bodySmall" color="onSurfaceVariant">
          Waiting
        </Text>
      ) : (
        <Text variant="bodySmall" color="error">
          Not verified
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabular: { fontVariant: ['tabular-nums'] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    paddingVertical: space[3],
    paddingHorizontal: space[4],
  },
  divider: { borderBottomWidth: 1, borderBottomColor: c.outlineVariant },
  words: { flex: 1, gap: 2 },
});
