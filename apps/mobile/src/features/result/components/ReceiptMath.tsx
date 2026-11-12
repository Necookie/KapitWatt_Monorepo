import type { Commitment, MockResultCard } from '@kapitwatt/shared';
import { themes } from '@kapitwatt/styles';
import { radius, space } from '@kapitwatt/tokens';
import { Text } from '@kapitwatt/ui';
import { StyleSheet, View } from 'react-native';
import { formatKw, formatKwh } from '@/utils/format';
import { Line } from './Line';

const c = themes.light.color;

/**
 * "How it adds up", in plain words: the household's usual use against its use during the peak,
 * the cut, the part of it that counts (up to what it committed), times the window's hours, and
 * whether the barangay reached its target.
 */
export function ReceiptMath(props: {
  result: MockResultCard;
  commitment: Commitment | null;
  hours: number;
}) {
  const r = props.result;
  const m = props.commitment;
  const hours = `${Number.isInteger(props.hours) ? props.hours : props.hours.toFixed(1)} hours`;
  return (
    <View style={styles.panel} accessibilityLabel="How it adds up">
      <Text variant="labelMedium" color="onSurfaceVariant" style={styles.overline}>
        HOW IT ADDS UP
      </Text>
      <View>
        {m ? <Line label="Your usual use" value={formatKw(m.baselineKw)} /> : null}
        {m?.actualKw != null ? <Line label="During the peak" value={formatKw(m.actualKw)} /> : null}
        <Line label="Your cut" value={formatKw(r.cutKw)} />
        <Line label={`Counted (up to ${formatKw(r.committedKw)})`} value={formatKw(r.paidCutKw)} />
        <Line label={`Verified, over ${hours}`} value={formatKwh(r.verifiedKwh)} />
        <Line
          label="Barangay target"
          value={r.barangayTargetHit ? 'Reached' : 'Not reached'}
          last
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: radius.lg,
    backgroundColor: c.surfaceContainerLow,
    padding: space[4],
    gap: space[1],
  },
  overline: { letterSpacing: 0.5 },
});
