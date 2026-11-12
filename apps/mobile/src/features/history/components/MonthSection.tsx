import type { MockHistoryItem } from '@kapitwatt/shared';
import { themes } from '@kapitwatt/styles';
import { radius, space } from '@kapitwatt/tokens';
import { Text } from '@kapitwatt/ui';
import { StyleSheet, View } from 'react-native';
import { NightRow } from './NightRow';

const c = themes.light.color;

/** One month of the log: its name over the month's nights in one panel. */
export function MonthSection(props: {
  month: string;
  items: MockHistoryItem[];
  onOpen: (item: MockHistoryItem) => void;
}) {
  return (
    <View style={styles.section}>
      <Text variant="labelMedium" color="onSurfaceVariant" style={styles.overline}>
        {props.month.toUpperCase()}
      </Text>
      <View style={styles.panel}>
        {props.items.map((item, i) => (
          <NightRow
            key={item.alert.id}
            item={item}
            last={i === props.items.length - 1}
            onOpen={() => props.onOpen(item)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: space[2] },
  overline: { letterSpacing: 0.5 },
  panel: {
    borderRadius: radius.lg,
    backgroundColor: c.surfaceContainerLow,
    overflow: 'hidden',
  },
});
