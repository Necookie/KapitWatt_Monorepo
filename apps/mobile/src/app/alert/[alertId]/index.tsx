import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { AlertBadge } from '@/components/event/AlertBadge';
import { BarangayProgress } from '@/components/event/BarangayProgress';
import { Countdown } from '@/components/event/Countdown';
import { PhotoSteps } from '@/components/event/PhotoSteps';
import { MockControls } from '@/components/MockControls';
import { Button, Card, ErrorState, Loading, Row, Screen, SimulatedNote } from '@/components/ui';
import { countdownTarget, eventPhase } from '@/lib/eventPhase';
import { formatClock, formatKw } from '@/lib/format';
import { useAlert, useAlertTotals, useMe, useMyEventStatus, useRefreshAll } from '@/lib/queries';
import { useServerNow } from '@/lib/serverTime';
import { colors, text } from '@/theme';

/** Event screen (FR-APP-09, 10, 18). Polls about every 2 s through the query hooks. */
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
  const commitment = status.data.commitment;
  const isAmi = me.data.meterType === 'ami';
  const canCommit = !commitment && (phase === 'before_window' || phase === 'window_open');
  const myBarangay = totals.data.barangays.find((b) => b.barangayId === me.data.barangayId);

  return (
    <Screen onRefresh={refreshAll} refreshing={alert.isRefetching}>
      <Card>
        <AlertBadge level={view.alert.level} />
        <Row
          label="Peak window"
          value={`${formatClock(view.alert.windowStart)} to ${formatClock(view.alert.windowEnd)}`}
          strong
        />
        {countdown ? <Countdown label={countdown.label} at={countdown.at} /> : null}
        {phase === 'settled' ? <Text style={styles.body}>Results are in.</Text> : null}
        {phase === 'cancelled' ? <Text style={styles.body}>This alert was lifted.</Text> : null}
      </Card>

      <Card title="Your commitment">
        {commitment ? (
          <Row label="You committed to cut" value={formatKw(commitment.committedKw)} strong />
        ) : canCommit && me.data.commitCapKw <= 0 ? (
          <>
            <Text style={styles.body}>
              Finish your practice run first, so we know your usual usage.
            </Text>
            <Button label="Start practice" onPress={() => router.push('/rehearsal')} />
          </>
        ) : canCommit ? (
          <>
            <Text style={styles.body}>
              Choose how many kW your household will cut during the window.
            </Text>
            <Button
              label="Commit a cut"
              onPress={() =>
                router.push({ pathname: '/alert/[alertId]/commit', params: { alertId } })
              }
            />
          </>
        ) : (
          <Text style={styles.body}>You did not commit to this event.</Text>
        )}
      </Card>

      {commitment && isAmi ? (
        <Card title="Smart meter">
          {phase === 'window_open' && status.data.liveReductionKw !== null ? (
            <>
              <Text style={styles.figure}>{formatKw(status.data.liveReductionKw)}</Text>
              <Text style={styles.body}>
                Live reduction against your usual usage, of {formatKw(commitment.committedKw)}{' '}
                committed.
              </Text>
            </>
          ) : (
            <Text style={styles.body}>No photos needed. Your smart meter reports your usage.</Text>
          )}
        </Card>
      ) : null}

      {commitment && !isAmi ? <PhotoSteps view={view} readings={status.data.readings} /> : null}

      {myBarangay ? <BarangayProgress row={myBarangay} settled={phase === 'settled'} /> : null}

      {phase === 'settled' && commitment ? (
        <Button
          label="See your result"
          onPress={() => router.push({ pathname: '/alert/[alertId]/result', params: { alertId } })}
        />
      ) : null}

      <SimulatedNote>Simulated NGCP alert for the Laguna pilot.</SimulatedNote>
      <MockControls />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { ...text.body, color: colors.muted },
  figure: { ...text.figure, color: colors.teal },
});
