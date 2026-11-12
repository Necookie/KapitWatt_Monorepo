import { Icon } from '@kapitwatt/icons';
import { type AlertLevel } from '@kapitwatt/shared';
import { themes } from '@kapitwatt/styles';
import { Mascot, Text } from '@kapitwatt/ui';
import { Pressable, StyleSheet, View } from 'react-native';
import type { BrownoutRisk } from '@/utils/brownout';
import { formatWindow } from '@/utils/format';
import { fonts, radius, space } from '@/styles/theme';

const c = themes.light.color;

/**
 * The NGCP alert on Home (mockup "Home · red alert"): the level in words with the alert icon,
 * the window, the alert-pose mascot and one action. Red and yellow only mean NGCP alerts.
 */
export function AlertCard(props: {
  level: AlertLevel;
  windowStart: string;
  windowEnd: string;
  /** Demo: brownout risk wording for this household (simulated), if the alert marks any. */
  risk?: BrownoutRisk | null;
  onOpen: () => void;
}) {
  const red = props.level === 'red';
  const fill = red ? c.alertRed : c.alertYellow;
  const ink = red ? c.onAlertRed : c.onAlertYellow;
  return (
    <View style={[styles.alert, { backgroundColor: fill }]} accessibilityRole="alert">
      <View style={styles.alertTop}>
        <View style={styles.flex}>
          <View style={styles.alertLevel}>
            <Icon name="alert" size="sm" weight="fill" color={ink} />
            <Text variant="labelMedium" style={[styles.caps, { color: ink }]}>
              {red ? 'RED ALERT · SIMULATED' : 'YELLOW ALERT · SIMULATED'}
            </Text>
          </View>
          <Text variant="titleLarge" style={{ color: ink }}>
            {props.risk?.headline ?? 'The grid needs help tonight'}
          </Text>
          <Text style={[styles.tabular, { color: ink }]}>
            {formatWindow(props.windowStart, props.windowEnd)}
          </Text>
          {props.risk ? (
            <Text variant="bodySmall" style={{ color: ink }}>
              {props.risk.line}
            </Text>
          ) : null}
        </View>
        <View
          style={[
            styles.mascotBadge,
            { backgroundColor: red ? c.alertRedContainer : c.alertYellowContainer },
          ]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <View style={styles.mascot}>
            <Mascot pose="alert" height={81} />
          </View>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={props.onOpen}
        style={({ pressed }) => [styles.alertButton, pressed && styles.pressed]}
      >
        <Text variant="titleMedium" style={{ color: fill }}>
          See what to do
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 4 },
  caps: { fontFamily: fonts.semibold, letterSpacing: 0.5 },
  tabular: { fontVariant: ['tabular-nums'] },
  alert: { borderRadius: 24, padding: 20, gap: space.lg },
  alertTop: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  alertLevel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  mascotBadge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  mascot: { marginBottom: -6 },
  alertButton: {
    height: 52,
    borderRadius: radius.md,
    backgroundColor: c.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.85 },
});
