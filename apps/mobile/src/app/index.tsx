import { Redirect, router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { AlertBadge } from '@/components/event/AlertBadge';
import { MockControls } from '@/components/MockControls';
import { Button, Card, ErrorState, Loading, Row, Screen, SimulatedNote } from '@/components/ui';
import { ApiError } from '@/lib/api';
import { formatClock } from '@/lib/format';
import { useActiveAlert, useMe, useRefreshAll } from '@/lib/queries';
import { colors, text } from '@/theme';

export default function HomeScreen() {
  const alert = useActiveAlert();
  const me = useMe();
  const refreshAll = useRefreshAll();

  // Not signed up yet: the API answers 401 without a household token.
  if (me.error instanceof ApiError && me.error.status === 401) return <Redirect href="/sign-up" />;
  if (alert.isPending || me.isPending) return <Loading />;
  if (alert.isError || me.isError) return <ErrorState onRetry={() => void refreshAll()} />;

  const needsRehearsal = me.data.needsRehearsal;

  const view = alert.data;

  return (
    // Pull to refresh finds the alert even if the push was missed (FR-APP-06).
    <Screen onRefresh={refreshAll}>
      {needsRehearsal ? (
        <Card title="Finish your practice run">
          <Text style={styles.body}>
            Take two practice meter photos so we know your usual usage. You need this before you can
            commit to a cut.
          </Text>
          <Button label="Start practice" onPress={() => router.push('/rehearsal')} />
        </Card>
      ) : null}

      {view ? (
        <Card>
          <AlertBadge level={view.alert.level} />
          <Text style={styles.message}>{view.alert.message}</Text>
          <Row
            label="Peak window"
            value={`${formatClock(view.alert.windowStart)} to ${formatClock(view.alert.windowEnd)}`}
            strong
          />
          <Button
            label="Open event"
            onPress={() =>
              router.push({ pathname: '/alert/[alertId]', params: { alertId: view.alert.id } })
            }
          />
        </Card>
      ) : (
        <Card title="No grid alert right now">
          <Text style={styles.body}>
            We will notify you when the grid needs help. Pull down to check again.
          </Text>
        </Card>
      )}

      <Card title="Your household">
        <Row label="Barangay" value={`${me.data.barangayName}, ${me.data.municipality}`} />
        <Row label="Meter" value={me.data.meterType === 'ami' ? 'Smart meter' : 'Photo readings'} />
        <Row label="Points" value={String(me.data.points)} strong />
        <Button
          label="Leaderboard"
          variant="secondary"
          onPress={() => router.push('/leaderboard')}
        />
        <Button label="History" variant="secondary" onPress={() => router.push('/history')} />
      </Card>

      <SimulatedNote>
        Laguna pilot. NGCP alerts and reward rates in this app are simulated placeholders.
      </SimulatedNote>
      <MockControls />
    </Screen>
  );
}

const styles = StyleSheet.create({
  message: { ...text.body, color: colors.ink },
  body: { ...text.body, color: colors.muted },
});
