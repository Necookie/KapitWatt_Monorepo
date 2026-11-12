import { Redirect } from 'expo-router';
import { MockControls } from '@/components/MockControls';
import { ErrorState, Loading } from '@/components/ui';
import { ApiError, describeError } from '@/api/http';
import { NextStepCard } from '@/components/next-step/NextStepCard';
import { TabScreen } from '@/layout/components/TabScreen';
import { BarangayTonight } from '../components/BarangayTonight';
import { LightCard } from '../components/LightCard';
import { useHome } from '../hooks/useHome';

/**
 * Home, the first tab: the night band with the household's place, a greeting and the grid's state,
 * then on the sheet the one thing to do next (it follows the event: commit, photos, result; the
 * practice run before the first alert; nothing on a quiet night), the barangay tonight during an
 * alert, and the household's light (Contribution Score, levels and perks).
 */
export default function HomePage() {
  const { alert, me, refreshAll, risk, title, place, logInAgain, nextStep } = useHome();

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
          <NextStepCard step={nextStep} risk={risk} />
          {view ? (
            <BarangayTonight alertId={view.alert.id} barangayId={me.data.barangayId} />
          ) : null}
          <LightCard score={me.data.trustScore} />
          <MockControls />
        </>
      )}
    </TabScreen>
  );
}
