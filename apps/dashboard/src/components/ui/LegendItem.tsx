import { StyleSheet, View } from 'react-native';
import { Txt } from './Txt';

/** A swatch plus a name. Sits beside any chart with two or more series. */
export function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.swatch, { backgroundColor: color }]} />
      <Txt size="sm" tone="muted">
        {label}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 10, height: 10, borderRadius: 2 },
});
