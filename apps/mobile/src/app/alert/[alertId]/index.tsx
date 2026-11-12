import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { AlertBadge } from '@/components/event/AlertBadge';
import { BarangayProgress } from '@/components/event/BarangayProgress';
import { Countdown } from '@/components/event/Countdown';
import { NowCard } from '@/components/event/NowCard';
import { StepList } from '@/components/event/StepList';
import { MockControls } from '@/components/MockControls';
import { Card, ErrorState, Loading, Row, Screen, SimulatedNote } from '@/components/ui';
import { countdownTarget, eventPhase } from '@/lib/eventPhase';
import { eventSteps, type NowAction } from '@/lib/eventSteps';
import { formatClock, formatKw } from '@/lib/format';
import { useAlert, useAlertTotals, useMe, useMyEventStatus, useRefreshAll } from '@/lib/queries';
import { useServerNow } from '@/lib/serverTime';
import { colors, text } from '@/theme';

/**
 * Event screen (FR-APP-09, 10, 18): one "do this now" card, then the step checklist, then the
 * barangay's progress. Polls about every 2 s through the query hooks.
 */
export default function EventScreen() {
  const { alertId } = useLocalSearchParams<{ alertId: string }>();
  const alert = useAlert(alertId);
  const status = useMyEventStatus(alertId);
  const totals = useAlertTotals(alertId);
  const me = useMe();
  const refreshAll = useRefreshAll();
  const now = useServerNow();

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
    commitCapKw: me.data.commitCapKw,
    now,
  });
  const commitment = status.data.commitment;
  const myBarangay = totals.data.barangays.find((b) => b.barangayId === me.data.barangayId);

  const runAction = (kind: NowAction) => {
    if (kind === 'rehearsal') router.push('/rehearsal');
    else if (kind === 'commit')
      router.push({ pathname: '/alert/[alertId]/commit', params: { alertId } });
    else if (kind === 'result')
      router.push({ pathname: '/alert/[alertId]/result', params: { alertId } });
    else router.push({ pathname: '/alert/[alertId]/capture', params: { alertId, kind } });
  };

  return (
    <Screen onRefresh={refreshAll}>
      <Card>
        <AlertBadge level={view.alert.level} />
        <Text style={styles.window}>
          Peak window {formatClock(view.alert.windowStart)} to {formatClock(view.alert.windowEnd)}
        </Text>
        {countdown ? <Countdown label={countdown.label} at={countdown.at} /> : null}
        {commitment ? (
          <Row label="Your commitment" value={formatKw(commitment.committedKw)} strong />
        ) : null}
      </Card>

      <NowCard
        card={nowCard}
        onAction={() => nowCard.action && runAction(nowCard.action.kind)}
        liveReductionKw={status.data.liveReductionKw}
        committedKw={commitment?.committedKw ?? null}
      />

      <StepList steps={steps} />

      {myBarangay ? <BarangayProgress row={myBarangay} settled={phase === 'settled'} /> : null}

      <SimulatedNote>Simulated NGCP alert for the Laguna pilot.</SimulatedNote>
      <MockControls />
    </Screen>
  );
}

const styles = StyleSheet.create({
  window: { ...text.title, color: colors.ink },
});
