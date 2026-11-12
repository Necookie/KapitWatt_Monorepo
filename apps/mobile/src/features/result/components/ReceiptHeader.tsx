import type { MockAlertView, ZeroPayoutReason } from '@kapitwatt/shared';
import { space } from '@kapitwatt/tokens';
import { Text } from '@kapitwatt/ui';
import { StyleSheet, View } from 'react-native';
import { LivingMascot } from '@/components/mascot/LivingMascot';
import { formatKwh, formatWindow } from '@/utils/format';
import { ZERO_REASON } from '../utils/zero-reason';

/** The top of a night's receipt: Alitaptap, the night (date, level, window) and its result. */
export function ReceiptHeader(props: {
  view: MockAlertView;
  zeroReason: ZeroPayoutReason | null;
  verifiedKwh: number;
}) {
  const { alert } = props.view;
  const date = new Date(alert.windowStart).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const level = alert.level === 'red' ? 'Red alert' : 'Yellow alert';
  const paid = props.zeroReason === null;
  return (
    <View style={styles.row}>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <LivingMascot pose={paid ? 'reward' : 'missed'} height={92} pokeable />
      </View>
      <View style={styles.words}>
        <Text variant="bodySmall" color="onSurfaceVariant" style={styles.tabular}>
          {`${date} · ${level} · ${formatWindow(alert.windowStart, alert.windowEnd)}`}
        </Text>
        <Text variant="titleLarge" accessibilityRole="header">
          {paid
            ? `You saved ${formatKwh(props.verifiedKwh)}`
            : ZERO_REASON[props.zeroReason ?? 'no_measured_cut']}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabular: { fontVariant: ['tabular-nums'] },
  row: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  words: { flex: 1, gap: space[1] },
});
