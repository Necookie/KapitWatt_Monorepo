import type { MockHistoryItem } from '@kapitwatt/shared';
import { themes } from '@kapitwatt/styles';
import { Text } from '@kapitwatt/ui';
import { Pressable, StyleSheet, View } from 'react-native';
import { AlertBadge } from '@/components/AlertBadge';
import { formatKw, formatKwh, formatWindow } from '@/utils/format';
import { radius, space } from '@/styles/theme';
import { dateLabel } from '../utils/date-label';

const c = themes.light.color;

export function HistoryCard(props: { item: MockHistoryItem; onOpen: () => void }) {
  const { item } = props;
  const r = item.result;
  const paid = r ? r.verifiedKwh > 0 : false;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={props.onOpen}
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
            {`Committed ${formatKw(item.committedKw)}`}
          </Text>
          <Text variant="titleSmall" color={!r ? 'onSurfaceVariant' : paid ? 'relief' : 'error'}>
            {!r ? 'Waiting for results' : paid ? 'Verified' : 'Not verified'}
          </Text>
        </View>
        {r ? (
          <View style={styles.amount}>
            <Text variant="titleMedium" style={styles.tabular}>
              {formatKwh(r.verifiedKwh)}
            </Text>
            <Text variant="bodySmall" color="onSurfaceVariant">
              saved
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  tabular: { fontVariant: ['tabular-nums'] },
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
