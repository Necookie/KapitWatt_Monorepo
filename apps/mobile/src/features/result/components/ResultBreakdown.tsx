import type { MockResultCard } from '@kapitwatt/shared';
import { themes } from '@kapitwatt/styles';
import { StyleSheet, View } from 'react-native';
import { formatKw, formatKwh } from '@/utils/format';
import { radius, space } from '@/styles/theme';
import { Line } from './Line';

const c = themes.light.color;

/** How it adds up: committed, verified cut and the barangay target. */
export function ResultBreakdown(props: { result: MockResultCard }) {
  const r = props.result;
  return (
    <View style={styles.panel} accessibilityLabel="How it adds up">
      <Line label="You committed" value={formatKw(r.committedKw)} />
      <Line label="Verified cut" value={`${formatKw(r.paidCutKw)} · ${formatKwh(r.verifiedKwh)}`} />
      <Line label="Barangay target" value={r.barangayTargetHit ? 'Reached' : 'Not reached'} last />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: radius.lg,
    backgroundColor: c.surfaceContainerLow,
    paddingHorizontal: space.lg,
    paddingVertical: space.xs,
  },
});
