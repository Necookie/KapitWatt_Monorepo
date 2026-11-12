import { Icon } from '@kapitwatt/icons';
import {
  CONTRIBUTION_BANDS,
  contributionStanding,
  TRUST,
  type AlertLevel,
} from '@kapitwatt/shared';
import { themes } from '@kapitwatt/styles';
import { Text } from '@kapitwatt/ui';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { MASCOT_POSES } from '@/components/mascot/poses';
import { ProgressBar } from '@/components/ui';
import { formatKw, formatWindow } from '@/lib/format';
import { perkLines } from '@/lib/perks';
import { useAlertTotals } from '@/lib/queries';
import { fonts, radius, space } from '@/theme';

const c = themes.light.color;
/** Text and icons on the orange score card. */
const ink = c.onTertiaryContainer;

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

/**
 * The household's Contribution Score and the perks it unlocks (Kuryente Orange: rewards). The perks
 * live here, on Home: the current band's in full, and every band behind "See all levels".
 */
export function ContributionCard(props: { score: number }) {
  const [open, setOpen] = useState(false);
  const score = Math.round(props.score);
  const { band, next, toNext } = contributionStanding(props.score);
  const perks = perkLines(band);
  return (
    <View style={styles.score}>
      <View style={styles.scoreHead}>
        <View style={styles.flex}>
          <Text variant="bodyMedium" style={{ color: ink }}>
            Contribution Score
          </Text>
          <View style={styles.scoreFigure}>
            <Text variant="headlineLarge" style={[styles.tabular, { color: ink }]}>
              {String(score)}
            </Text>
            <Text variant="titleMedium" style={[styles.tabular, { color: ink }]}>
              {`/ ${TRUST.max}`}
            </Text>
          </View>
        </View>
        <View style={styles.level}>
          <Text variant="titleSmall" style={{ color: c.onBrandAccent }}>
            {band.name}
          </Text>
        </View>
      </View>

      <ProgressBar
        value={props.score / TRUST.max}
        tone="primary"
        accessibilityLabel={`Contribution Score ${score} out of ${TRUST.max}`}
      />
      <Text variant="bodyMedium" style={{ color: ink }}>
        {next
          ? `${toNext} more to reach ${next.name}. Each verified cut adds ${TRUST.cleanEvent}.`
          : 'You are at the top level.'}
      </Text>

      <View style={styles.perks}>
        <Text variant="titleSmall" style={{ color: ink }}>
          {perks.length > 0 ? 'Your perks' : 'Your perks are paused'}
        </Text>
        {perks.length > 0 ? (
          perks.map((line) => <Perk key={line} line={line} />)
        ) : (
          <Text variant="bodyMedium" style={{ color: ink }}>
            {`They come back at ${next?.minScore ?? TRUST.start}. A verified cut in the next grid alert adds ${TRUST.cleanEvent}.`}
          </Text>
        )}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((v) => !v)}
        style={({ pressed }) => [styles.toggle, pressed && styles.pressed]}
      >
        <Text variant="titleSmall" style={{ color: ink }}>
          {open ? 'Hide levels' : 'See all levels'}
        </Text>
        <Icon name={open ? 'chevronUp' : 'chevronDown'} size="sm" color={ink} />
      </Pressable>

      {open
        ? CONTRIBUTION_BANDS.filter((b) => b.minScore >= TRUST.start).map((b) => {
            const reached = props.score >= b.minScore;
            return (
              <View key={b.name} style={styles.band}>
                <View style={styles.bandHead}>
                  <Icon name={reached ? 'check' : 'locked'} size="sm" color={ink} />
                  <Text variant="titleSmall" style={[styles.flex, { color: ink }]}>
                    {b.name}
                  </Text>
                  <Text variant="bodySmall" style={[styles.tabular, { color: ink }]}>
                    {`from ${b.minScore}`}
                  </Text>
                </View>
                {perkLines(b).map((line) => (
                  <Text key={line} variant="bodySmall" style={{ color: ink }}>
                    {line}
                  </Text>
                ))}
              </View>
            );
          })
        : null}

      <Text variant="bodySmall" style={{ color: ink }}>
        Proposed perks for the pilot. None is agreed with Meralco or a partner yet.
      </Text>
    </View>
  );
}

function Perk(props: { line: string }) {
  return (
    <View style={styles.perk}>
      <Icon name="check" size="sm" color={ink} />
      <Text variant="bodyMedium" style={[styles.flex, { color: ink }]}>
        {props.line}
      </Text>
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
  score: {
    borderRadius: radius.lg,
    backgroundColor: c.tertiaryContainer,
    padding: space.lg,
    gap: space.md,
  },
  scoreHead: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  scoreFigure: { flexDirection: 'row', alignItems: 'baseline', gap: space.xs },
  level: {
    height: 32,
    paddingHorizontal: space.md,
    borderRadius: radius.sm,
    backgroundColor: c.brandAccent,
    justifyContent: 'center',
  },
  perks: { gap: space.sm },
  perk: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: space.xs, minHeight: 44 },
  band: { gap: 2, paddingTop: space.sm, borderTopWidth: 1, borderTopColor: c.outlineVariant },
  bandHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  panel: {
    borderRadius: radius.lg,
    backgroundColor: c.surfaceContainerLow,
    padding: space.lg,
    gap: 10,
  },
  panelHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
});
