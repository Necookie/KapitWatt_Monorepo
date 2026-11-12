import { Icon } from '@kapitwatt/icons';
import type { AlertLevel } from '@kapitwatt/shared';
import { themes } from '@kapitwatt/styles';
import { Text } from '@kapitwatt/ui';
import { Pressable, StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { MASCOT_POSES } from '@/components/mascot/poses';
import { ProgressBar } from '@/components/ui';
import { formatKw, formatPhp, formatWindow } from '@/lib/format';
import { useAlertTotals } from '@/lib/queries';
import { fonts, radius, space } from '@/theme';

const c = themes.light.color;

/**
 * The NGCP alert on Home (mockup "Home · red alert"): the level in words with the alert icon,
 * the window, the alert-pose mascot and one action. Red and yellow only mean NGCP alerts.
 */
export function AlertCard(props: {
  level: AlertLevel;
  windowStart: string;
  windowEnd: string;
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
            The grid needs help tonight
          </Text>
          <Text style={[styles.tabular, { color: ink }]}>
            {formatWindow(props.windowStart, props.windowEnd)}
          </Text>
        </View>
        <View
          style={[
            styles.mascotBadge,
            { backgroundColor: red ? c.alertRedContainer : c.alertYellowContainer },
          ]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <SvgXml xml={MASCOT_POSES.alert} width={70} height={81} style={styles.mascot} />
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

/** No alert right now: the calm mascot, so Home is never empty. */
export function QuietCard() {
  return (
    <View style={styles.quiet}>
      <View
        style={styles.quietBadge}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <SvgXml xml={MASCOT_POSES.neutral} width={56} height={65} style={styles.mascotSmall} />
      </View>
      <View style={styles.flex}>
        <Text variant="titleMedium">No grid alert right now</Text>
        <Text variant="bodyMedium" color="onSurfaceVariant">
          We will tell you when the grid needs help. Pull down to check again.
        </Text>
      </View>
    </View>
  );
}

/** Points (Kuryente Orange: rewards) and bill credit so far. */
export function RewardTiles(props: { points: number; creditPhp: number }) {
  return (
    <View style={styles.tiles}>
      <View style={[styles.tile, { backgroundColor: c.tertiaryContainer }]}>
        <Text variant="bodyMedium" style={{ color: c.onTertiaryContainer }}>
          Points
        </Text>
        <Text variant="headlineMedium" style={[styles.tabular, { color: c.onTertiaryContainer }]}>
          {String(props.points)}
        </Text>
      </View>
      <View style={[styles.tile, { backgroundColor: c.surfaceContainerLow }]}>
        <Text variant="bodyMedium" color="onSurfaceVariant">
          Bill credit
        </Text>
        <Text variant="headlineMedium" style={styles.tabular}>
          {formatPhp(props.creditPhp)}
        </Text>
      </View>
    </View>
  );
}

/** The household's barangay against tonight's target, polled with the alert totals. */
export function BarangayTonight(props: { alertId: string; barangayId: string }) {
  const totals = useAlertTotals(props.alertId);
  const row = totals.data?.barangays.find((b) => b.barangayId === props.barangayId);
  if (!row) return null;
  const share = row.targetKw > 0 ? row.committedKw / row.targetKw : 0;
  return (
    <View style={styles.panel}>
      <View style={styles.panelHead}>
        <Text variant="titleMedium">{row.name} tonight</Text>
        <Text variant="bodyMedium" color="onSurfaceVariant" style={styles.tabular}>
          Target {formatKw(row.targetKw)}
        </Text>
      </View>
      <ProgressBar
        value={share}
        tone="primary"
        accessibilityLabel={`${Math.round(share * 100)}% of the target committed`}
      />
      <Text variant="bodyMedium" color="onSurfaceVariant">
        {`${formatKw(row.committedKw)} committed by your neighbours so far`}
      </Text>
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
  quiet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    padding: space.lg,
    borderRadius: radius.lg,
    backgroundColor: c.surfaceContainerLow,
  },
  quietBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFEDE8',
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  mascotSmall: { marginBottom: -5 },
  tiles: { flexDirection: 'row', gap: space.md },
  tile: { flex: 1, borderRadius: radius.lg, padding: space.lg, gap: 2 },
  panel: {
    borderRadius: radius.lg,
    backgroundColor: c.surfaceContainerLow,
    padding: space.lg,
    gap: 10,
  },
  panelHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
});
