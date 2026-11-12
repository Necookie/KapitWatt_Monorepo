import { Logo, Text } from '@kapitwatt/ui';
import { Redirect, router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import {
  AlertCard,
  BarangayTonight,
  ContributionCard,
  QuietCard,
} from '@/components/home/HomeCards';
import { MascotHeader } from '@/components/mascot/MascotHeader';
import { MockControls } from '@/components/MockControls';
import { Button, ErrorState, Loading, Screen } from '@/components/ui';
import { ApiError, describeError } from '@/lib/api';
import { useBrownoutRisk } from '@/lib/brownout';
import { startOver } from '@/lib/nav';
import { useActiveAlert, useLogout, useMe, useRefreshAll } from '@/lib/queries';
import { space } from '@/theme';

/** "Juan Dela Cruz" -> "Juan"; households from before names were collected get a neutral hello. */
const firstName = (name: string | null) => name?.trim().split(/\s+/)[0] ?? null;

/**
 * Home (mockup "Home · red alert"): greeting, the alert if there is one, the Contribution Score
 * with its perks, barangay.
 */
export default function HomeScreen() {
  const alert = useActiveAlert();
  const me = useMe();
  const refreshAll = useRefreshAll();
  const risk = useBrownoutRisk(alert.data?.alert, me.data?.barangayId);
  const logout = useLogout();

  // Not signed in: the API answers 401 without a household token.
  if (me.error instanceof ApiError && me.error.status === 401) return <Redirect href="/welcome" />;
  if (alert.isPending || me.isPending) return <Loading />;
  if (alert.isError || me.isError) {
    return (
      <ErrorState
        message={describeError(
          me.error ?? alert.error,
          {},
          'Check your connection, then try again.',
        )}
        onRetry={() => void refreshAll()}
        // Without this a phone whose saved login the server cannot read is stuck on this screen.
        action={{
          label: 'Log in again',
          onPress: () => logout.mutate(undefined, { onSettled: () => startOver('/welcome') }),
        }}
      />
    );
  }

  const h = me.data;
  const view = alert.data;
  const name = firstName(h.accountName);

  return (
    // Pull to refresh finds the alert even if the push was missed (FR-APP-06).
    <Screen roomy noHeader onRefresh={refreshAll}>
      <View style={styles.greeting}>
        <View style={styles.flex}>
          <Text variant="bodyMedium" color="onSurfaceVariant">
            {`${h.barangayName}, ${h.municipality}`}
          </Text>
          <Text variant="headlineMedium" accessibilityRole="header">
            {name ? `Hi, ${name}` : 'Hello'}
          </Text>
        </View>
        <Logo height={20} />
      </View>

      {h.needsRehearsal ? (
        <View style={styles.block}>
          <MascotHeader
            label="Practice run"
            line="Take two practice photos before your first alert."
          />
          <Button label="Start practice" onPress={() => router.push('/rehearsal')} />
        </View>
      ) : null}

      {view ? (
        <AlertCard
          level={view.alert.level}
          windowStart={view.alert.windowStart}
          windowEnd={view.alert.windowEnd}
          risk={risk}
          onOpen={() =>
            router.push({ pathname: '/alert/[alertId]', params: { alertId: view.alert.id } })
          }
        />
      ) : (
        <QuietCard />
      )}

      <ContributionCard score={h.trustScore} />

      {view ? <BarangayTonight alertId={view.alert.id} barangayId={h.barangayId} /> : null}

      <MockControls />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  greeting: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  block: { gap: space.md },
});
