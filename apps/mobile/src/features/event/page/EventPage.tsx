import { Text } from '@kapitwatt/ui';
import { StyleSheet, View } from 'react-native';
import { AlertBadge } from '@/components/AlertBadge';
import { MockControls } from '@/components/MockControls';
import { ErrorState, Loading, Screen } from '@/components/ui';
import { formatKw, formatWindow } from '@/utils/format';
import { fonts } from '@/styles/theme';
import { BarangayProgress } from '../components/BarangayProgress';
import { Countdown } from '../components/Countdown';
import { NowCard } from '../components/NowCard';
import { RiskNotice } from '../components/RiskNotice';
import { StepList } from '../components/StepList';
import { useEvent } from '../hooks/useEvent';

/**
 * Event screen (FR-APP-09, 10, 18; mockup "Event · window open"): alert and countdown, the mascot
 * saying the one thing to do now, the step checklist, then the barangay's progress.
 * Polls about every 2 s through the query hooks.
 */
export default function EventPage() {
  const event = useEvent();

  if (event.state === 'pending') return <Loading />;
  if (event.state === 'error') return <ErrorState onRetry={() => void event.refreshAll()} />;

  const { view, settled, risk, countdown, commitment, nowCard, steps, myBarangay, mood, live } =
    event;

  return (
    <Screen roomy onRefresh={event.refreshAll}>
      <View style={styles.alertRow}>
        <AlertBadge level={view.alert.level} />
        <Text variant="bodyMedium" color="onSurfaceVariant" style={styles.tabular}>
          {formatWindow(view.alert.windowStart, view.alert.windowEnd)}
        </Text>
      </View>

      {risk ? <RiskNotice risk={risk} /> : null}

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

      <NowCard card={nowCard} mood={mood} live={live} onAction={event.runAction} />

      <StepList steps={steps} />

      {myBarangay ? <BarangayProgress row={myBarangay} settled={settled} /> : null}

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
  strong: { fontFamily: fonts.semibold },
  tabular: { fontVariant: ['tabular-nums'] },
});
