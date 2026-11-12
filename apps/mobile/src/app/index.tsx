import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { AlertBadge } from '@/components/event/AlertBadge';
import { MockControls } from '@/components/MockControls';
import { Button, Card, ErrorState, Loading, Row, Screen, SimulatedNote } from '@/components/ui';
import { formatClock } from '@/lib/format';
import { useActiveAlert, useMe, useRefreshAll } from '@/lib/queries';
import { colors, text } from '@/theme';

export default function HomeScreen() {
  const alert = useActiveAlert();
  const me = useMe();
  const refreshAll = useRefreshAll();

  if (alert.isPending || me.isPending) return <Loading />;
  if (alert.isError || me.isError) return <ErrorState onRetry={() => void refreshAll()} />;

  const view = alert.data;

  return (
    // Pull to refresh finds the alert even if the push was missed (FR-APP-06).
    <Screen onRefresh={refreshAll} refreshing={alert.isRefetching}>
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
        <Row label="Points" value={String(me.data.totalPoints)} strong />
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
