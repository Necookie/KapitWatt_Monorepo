import { Text } from '@kapitwatt/ui';
import { MockControls } from '@/components/MockControls';
import { NextStepCard } from '@/components/next-step/NextStepCard';
import { ErrorState, Loading } from '@/components/ui';
import { BandScreen } from '@/layout/components/BandScreen';
import { BarangayProgress } from '../components/BarangayProgress';
import { EventBand } from '../components/EventBand';
import { StepList } from '../components/StepList';
import { useEvent } from '../hooks/useEvent';

/**
 * The event screen, in the tabs' frame: the night band holds the NGCP level, the window and the
 * countdown (and the household's commitment); on the sheet, Home's own next-step card (with the
 * live reduction for a smart meter), tonight's steps with their times, and the barangay's progress.
 * Polls about every 2 s.
 */
export default function EventPage() {
  const event = useEvent();

  if (event.state !== 'ready') {
    return (
      <BandScreen band={null} onRefresh={event.refreshAll}>
        {event.state === 'pending' ? (
          <Loading />
        ) : (
          <ErrorState onRetry={() => void event.refreshAll()} />
        )}
      </BandScreen>
    );
  }

  return (
    <BandScreen
      onRefresh={event.refreshAll}
      band={
        <EventBand
          view={event.view}
          countdown={event.countdown}
          committedKw={event.commitment?.committedKw ?? null}
        />
      }
    >
      <NextStepCard step={event.nextStep} risk={event.risk} live={event.live} />
      <StepList steps={event.steps} />
      {event.myBarangay ? (
        <BarangayProgress row={event.myBarangay} settled={event.settled} />
      ) : null}

      <Text variant="bodySmall" color="onSurfaceVariant" align="center">
        Simulated NGCP alert for the Laguna pilot.
      </Text>
      <MockControls />
    </BandScreen>
  );
}
