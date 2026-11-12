import { roundKw } from '@kapitwatt/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useAlert, useCommit, useMe } from '@/api/queries';
import { commitError } from '../utils/commit-error';
import { STEP_KW } from '../utils/commit-step';

/** The alert in the route, the household's cap and the chosen kW, and the commit mutation. */
export function useCommitForm() {
  const { alertId } = useLocalSearchParams<{ alertId: string }>();
  const me = useMe();
  const alert = useAlert(alertId);
  const commit = useCommit();
  const [kw, setKw] = useState<number | null>(null);

  if (me.isPending || alert.isPending) return { state: 'pending' as const };
  if (me.isError || alert.isError) {
    return {
      state: 'error' as const,
      retry: () => {
        void me.refetch();
        void alert.refetch();
      },
    };
  }

  const cap = me.data.commitCapKw ?? 0;
  const selected = kw ?? Math.min(1, cap);
  const set = (next: number) => setKw(roundKw(Math.min(cap, Math.max(STEP_KW, next))));
  const { windowStart, windowEnd } = alert.data.alert;

  return {
    state: 'ready' as const,
    cap,
    selected,
    set,
    windowStart,
    windowEnd,
    saving: commit.isPending,
    error: commit.isError ? commitError(commit.error) : null,
    submit: () =>
      commit.mutate({ alertId, committedKw: selected }, { onSuccess: () => router.back() }),
  };
}
