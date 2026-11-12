import { StyleSheet, View } from 'react-native';
import { colors, radius } from '@/theme';

/** 0..1 fills the bar; above 1 stays full and turns green (target hit). */
export function ProgressBar(props: { value: number }) {
  const pct = Math.max(0, Math.min(1, props.value)) * 100;
  const hit = props.value >= 1;
  return (
    <View
      style={styles.track}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct) }}
    >
      <View
        style={[
          styles.fill,
          { width: `${pct}%`, backgroundColor: hit ? colors.green : colors.teal },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radius.pill },
});
