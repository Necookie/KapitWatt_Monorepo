import { router, useLocalSearchParams } from 'expo-router';
import { MeterCapture } from '@/components/capture/MeterCapture';
import { ErrorState, Screen } from '@/components/ui';

/** Before or after photo for an event. The event screen only links here while the window is open. */
export default function CaptureScreen() {
  const { alertId, kind } = useLocalSearchParams<{ alertId: string; kind: string }>();
  if (kind !== 'before' && kind !== 'after') {
    return <ErrorState message="Unknown photo type." onRetry={() => router.back()} />;
  }
  return (
    <Screen>
      <MeterCapture
        kind={kind}
        alertId={alertId}
        title={kind === 'before' ? 'Before photo' : 'After photo'}
        onDone={() => router.back()}
      />
    </Screen>
  );
}
