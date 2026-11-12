import { router } from 'expo-router';
import { MeterCapture } from '@/components/capture/MeterCapture';
import { ErrorState } from '@/components/ui';
import { formatClock } from '@/utils/format';
import { useCapture } from '../hooks/useCapture';

/**
 * Before or after photo for an event, full screen (the root layout hides this route's header).
 * The event screen only links here while the photo's window is open.
 */
export default function CapturePage() {
  const { alertId, kind, due } = useCapture();
  if (kind !== 'before' && kind !== 'after') {
    return <ErrorState message="Unknown photo type." onRetry={() => router.back()} />;
  }
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
