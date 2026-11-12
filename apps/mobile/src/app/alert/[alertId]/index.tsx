import { Icon } from '@kapitwatt/icons';
import { themes } from '@kapitwatt/styles';
import { Text } from '@kapitwatt/ui';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AlertBadge } from '@/components/event/AlertBadge';
import { BarangayProgress } from '@/components/event/BarangayProgress';
import { Countdown } from '@/components/event/Countdown';
import { StepList } from '@/components/event/StepList';
import { MascotHeader } from '@/components/mascot/MascotHeader';
import type { MascotPose } from '@/components/mascot/poses';
import { MockControls } from '@/components/MockControls';
import { Button, ErrorState, Loading, Screen } from '@/components/ui';
import { useBrownoutRisk } from '@/lib/brownout';
import { countdownTarget, eventPhase, type EventPhase } from '@/lib/eventPhase';
import { eventSteps, type NowAction } from '@/lib/eventSteps';
import { formatKw, formatWindow } from '@/lib/format';
import { useAlert, useAlertTotals, useMe, useMyEventStatus, useRefreshAll } from '@/lib/queries';
import { useServerNow } from '@/lib/serverTime';
import { fonts, radius, space } from '@/theme';

const c = themes.light.color;

/** The mascot's mood follows the event: calm, cutting power, then celebrating. */
const MOOD: Record<EventPhase, { pose: MascotPose; tone: 'primary' | 'reward' }> = {
  before_window: { pose: 'neutral', tone: 'primary' },
  window_open: { pose: 'dimmed', tone: 'primary' },
  settling: { pose: 'neutral', tone: 'primary' },
  settled: { pose: 'reward', tone: 'reward' },
  cancelled: { pose: 'neutral', tone: 'primary' },
};

/**
 * Event screen (FR-APP-09, 10, 18; mockup "Event · window open"): alert and countdown, the mascot
 * saying the one thing to do now, the step checklist, then the barangay's progress.
 * Polls about every 2 s through the query hooks.
 */
export default function EventScreen() {
  const { alertId } = useLocalSearchParams<{ alertId: string }>();
  const alert = useAlert(alertId);
  const status = useMyEventStatus(alertId);
  const totals = useAlertTotals(alertId);
  const me = useMe();
  const refreshAll = useRefreshAll();
  const now = useServerNow();
  const risk = useBrownoutRisk(alert.data?.alert, me.data?.barangayId);

  if (alert.isPending || status.isPending || totals.isPending || me.isPending) return <Loading />;
  if (alert.isError || status.isError || totals.isError || me.isError) {
    return <ErrorState onRetry={() => void refreshAll()} />;
  }

  const view = alert.data;
  const phase = eventPhase(view, now);
  const countdown = countdownTarget(view, phase);
  const { now: nowCard, steps } = eventSteps({
    view,
    phase,
    status: status.data,
    meterType: me.data.meterType,
    commitCapKw: me.data.commitCapKw ?? 0,
    now,
  });
  const commitment = status.data.commitment;
  const myBarangay = totals.data.barangays.find((b) => b.barangayId === me.data.barangayId);
  const mood = MOOD[phase];
  const live = nowCard.showLiveReduction ? status.data.liveReductionKw : null;

  const runAction = (kind: NowAction) => {
    if (kind === 'rehearsal') router.push('/rehearsal');
    else if (kind === 'commit')
      router.push({ pathname: '/alert/[alertId]/commit', params: { alertId } });
    else if (kind === 'result')
      router.push({ pathname: '/alert/[alertId]/result', params: { alertId } });
    else router.push({ pathname: '/alert/[alertId]/capture', params: { alertId, kind } });
  };

  return (
    <Screen roomy onRefresh={refreshAll}>
      <View style={styles.alertRow}>
        <AlertBadge level={view.alert.level} />
        <Text variant="bodyMedium" color="onSurfaceVariant" style={styles.tabular}>
          {formatWindow(view.alert.windowStart, view.alert.windowEnd)}
        </Text>
      </View>

      {risk ? (
        <View style={[styles.risk, risk.kind === 'help' && styles.riskHelp]}>
          <Icon
            name="alert"
            size="sm"
            weight="fill"
            color={risk.kind === 'own' ? 'error' : 'onSurfaceVariant'}
          />
          <Text
            variant="bodyMedium"
            color={risk.kind === 'own' ? 'onErrorContainer' : 'onSurface'}
            style={styles.flex}
          >
            {risk.line}
          </Text>
        </View>
      ) : null}

      {countdown || commitment ? (
        <View style={styles.countdown}>
          {countdown ? <Countdown label={countdown.label} at={countdown.at} /> : null}
          {commitment ? (
            <Text variant="bodyMedium" color="onSurfaceVariant">
              You committed{' '}
              <Text variant="bodyMedium" style={styles.strong}>
                {formatKw(commitment.committedKw)}
              </Text>
            </Text>
          ) : null}
        </View>
      ) : null}

      <View style={styles.now}>
        <MascotHeader label="Do this now" line={nowCard.title} pose={mood.pose} tone={mood.tone} />
        <Text color="onSurfaceVariant">{nowCard.body}</Text>
        {live !== null ? (
          <View>
            <Text variant="headlineMedium" color="relief" style={styles.tabular}>
              {formatKw(live)}
            </Text>
            <Text variant="bodyMedium" color="onSurfaceVariant">
              below your usual usage right now
            </Text>
          </View>
        ) : null}
        {nowCard.action ? (
          <Button
            label={nowCard.action.label}
            onPress={() => nowCard.action && runAction(nowCard.action.kind)}
          />
        ) : null}
      </View>

      <StepList steps={steps} />

      {myBarangay ? <BarangayProgress row={myBarangay} settled={phase === 'settled'} /> : null}

      <Text variant="bodySmall" color="onSurfaceVariant" align="center">
        Simulated NGCP alert for the Laguna pilot.
      </Text>
      <MockControls />
    </Screen>
  );
}

const styles = StyleSheet.create({
  alertRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  countdown: { gap: 2 },
  now: { gap: space.md },
  strong: { fontFamily: fonts.semibold },
  flex: { flex: 1 },
  risk: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: c.errorContainer,
  },
  riskHelp: { backgroundColor: c.surfaceContainerHigh },
  tabular: { fontVariant: ['tabular-nums'] },
});
