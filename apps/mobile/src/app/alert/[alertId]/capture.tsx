import { router, useLocalSearchParams } from 'expo-router';
import { MeterCapture } from '@/components/capture/MeterCapture';
import { ErrorState } from '@/components/ui';
import { formatClock } from '@/lib/format';
import { useAlert } from '@/lib/queries';

/**
 * Before or after photo for an event, full screen (the root layout hides this route's header).
 * The event screen only links here while the photo's window is open.
 */
export default function CaptureScreen() {
  const { alertId, kind } = useLocalSearchParams<{ alertId: string; kind: string }>();
  const alert = useAlert(alertId);
  if (kind !== 'before' && kind !== 'after') {
    return <ErrorState message="Unknown photo type." onRetry={() => router.back()} />;
  }
  const due = alert.data
    ? kind === 'before'
      ? alert.data.beforePhotoDueAt
      : alert.data.afterPhotoDueAt
    : null;
  return (
    <MeterCapture
      kind={kind}
      alertId={alertId}
      title={kind === 'before' ? 'Before photo' : 'After photo'}
      subtitle={due ? `Due ${formatClock(due)}` : undefined}
      onDone={() => router.back()}
      onClose={() => router.back()}
    />
  );
}
