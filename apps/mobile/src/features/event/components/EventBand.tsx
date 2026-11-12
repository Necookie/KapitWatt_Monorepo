import type { MockAlertView } from '@kapitwatt/shared';
import { themes } from '@kapitwatt/styles';
import { space, withAlpha } from '@kapitwatt/tokens';
import { Text } from '@kapitwatt/ui';
import { StyleSheet, View } from 'react-native';
import { AlertBadge } from '@/components/AlertBadge';
import { formatKw, formatWindow } from '@/utils/format';
import { BandCountdown } from './BandCountdown';

const c = themes.light.color;
const ON_SOFT = withAlpha(c.onBrand, 0.78);

/**
 * The event's night band: the NGCP level (in words, with the alert icon) and the window, then the
 * countdown to the next moment large and white (on the server clock), and the household's
 * commitment once it has one.
 */
export function EventBand(props: {
  view: MockAlertView;
  countdown: { label: string; at: string } | null;
  committedKw: number | null;
}) {
  const { alert } = props.view;
  return (
    <View style={styles.band}>
      <View style={styles.alert}>
        <AlertBadge level={alert.level} />
        <Text variant="bodyMedium" style={[styles.tabular, { color: ON_SOFT }]}>
          {formatWindow(alert.windowStart, alert.windowEnd)}
        </Text>
      </View>
      {props.countdown ? (
        <BandCountdown label={props.countdown.label} at={props.countdown.at} />
      ) : null}
      {props.committedKw !== null ? (
        <Text variant="bodyMedium" style={{ color: ON_SOFT }}>
          {`You committed ${formatKw(props.committedKw)}`}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tabular: { fontVariant: ['tabular-nums'] },
  band: { gap: space[2] },
  alert: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
});
