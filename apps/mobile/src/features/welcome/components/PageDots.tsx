import { themes } from '@kapitwatt/styles';
import { withAlpha } from '@kapitwatt/tokens';
import { StyleSheet, View } from 'react-native';

const c = themes.light.color;

/** Which story panel is showing: the current one is a longer bar. */
export function PageDots({ count, index }: { count: number; index: number }) {
  return (
    <View style={styles.row} accessibilityLabel={`Page ${index + 1} of ${count}`}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={[styles.dot, i === index && styles.current]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: withAlpha(c.onBrand, 0.35) },
  current: { width: 20, backgroundColor: c.onBrand },
});
