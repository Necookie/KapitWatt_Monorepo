import { Redirect } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { MascotHeader } from '@/components/mascot/MascotHeader';
import { MockControls } from '@/components/MockControls';
import { Button, ErrorState, Loading } from '@/components/ui';
import { ApiError, describeError } from '@/api/http';
import { TabScreen } from '@/layout/components/TabScreen';
import { space } from '@/styles/theme';
import { AlertCard } from '../components/AlertCard';
import { BarangayTonight } from '../components/BarangayTonight';
import { ContributionCard } from '../components/ContributionCard';
import { QuietCard } from '../components/QuietCard';
import { useHome } from '../hooks/useHome';

/**
 * Home, the first tab: the night band with the household's place, a greeting and the grid's state,
 * then on the sheet the practice run if it is still due, the alert if there is one, the
 * Contribution Score with its perks, and the barangay tonight.
 */
export default function HomePage() {
  const { alert, me, refreshAll, risk, title, place, logInAgain, startPractice, openAlert } =
    useHome();

  // Not signed in: the API answers 401 without a household token.
  if (me.error instanceof ApiError && me.error.status === 401) return <Redirect href="/welcome" />;
  const view = alert.data;

  return (
    // Pull to refresh finds the alert even if the push was missed (FR-APP-06).
    <TabScreen title={title} overline={place} onRefresh={refreshAll}>
      {alert.isPending || me.isPending ? (
        <Loading />
      ) : alert.isError || me.isError ? (
        <ErrorState
          message={describeError(
            me.error ?? alert.error,
            {},
            'Check your connection, then try again.',
          )}
          onRetry={() => void refreshAll()}
          // Without this a phone whose saved login the server cannot read is stuck on this screen.
          action={{ label: 'Log in again', onPress: logInAgain }}
        />
      ) : (
        <>
          {me.data.needsRehearsal ? (
            <View style={styles.block}>
              <MascotHeader
                label="Practice run"
                line="Take two practice photos before your first alert."
              />
              <Button label="Start practice" onPress={startPractice} />
            </View>
          ) : null}

          {view ? (
            <AlertCard
              level={view.alert.level}
              windowStart={view.alert.windowStart}
              windowEnd={view.alert.windowEnd}
              risk={risk}
              onOpen={() => openAlert(view.alert.id)}
            />
          ) : (
            <QuietCard />
          )}

          <ContributionCard score={me.data.trustScore} />
          {view ? (
            <BarangayTonight alertId={view.alert.id} barangayId={me.data.barangayId} />
          ) : null}
          <MockControls />
        </>
      )}
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  block: { gap: space.md },
});
