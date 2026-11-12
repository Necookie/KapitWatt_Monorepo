import { router } from 'expo-router';
import { useState } from 'react';
import { mockSkipRehearsal } from '@/api/mock';
import { useMe, useRefreshAll } from '@/api/queries';

/**
 * The practice run's flow: which photo is next (from the server's `rehearsalReadings`, so a
 * restart resumes at the right photo), whether the camera is open, and whether it is complete.
 */
export function useRehearsal() {
  const me = useMe();
  const refreshAll = useRefreshAll();
  const [capturing, setCapturing] = useState(false);
  const [finished, setFinished] = useState(false);

  if (me.isPending) return { state: 'pending' as const };
  if (me.isError) return { state: 'error' as const, retry: () => void me.refetch() };
  const h = me.data;

  const taken = Math.min(2, h.rehearsalReadings);
  const nextPhoto = taken === 0 ? 1 : 2;

  return {
    state: 'ready' as const,
    household: h,
    smartMeter: h.meterType === 'ami',
    capturing,
    complete: finished || taken >= 2,
    taken,
    nextPhoto,
    startCapture: () => setCapturing(true),
    closeCapture: () => setCapturing(false),
    onCaptured: () => {
      setCapturing(false);
      if (nextPhoto === 2) setFinished(true);
      void me.refetch();
    },
    skipPractice: () => {
      mockSkipRehearsal();
      void refreshAll();
      router.replace('/');
    },
  };
}
