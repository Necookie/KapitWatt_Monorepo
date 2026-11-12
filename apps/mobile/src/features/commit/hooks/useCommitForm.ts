import { roundKw } from '@kapitwatt/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useAlert, useCommit, useMe } from '@/api/queries';
import { commitError } from '../utils/commit-error';
import { STEP_KW } from '../utils/commit-step';
import { useStreetDim } from './useStreetDim';

/** The alert in the route, the household's cap and the chosen kW, and the commit mutation. */
export function useCommitForm() {
  const { alertId } = useLocalSearchParams<{ alertId: string }>();
  const me = useMe();
  const alert = useAlert(alertId);
  const commit = useCommit();
  const [kw, setKw] = useState<number | null>(null);
  // The band's street dims with the cut, from all lit to all dark at the household's limit.
  const capKw = me.data?.commitCapKw ?? 0;
  const street = useStreetDim(capKw > 0 ? (kw ?? Math.min(1, capKw)) / capKw : 0);

  if (me.isPending || alert.isPending) return { state: 'pending' as const, street };
  if (me.isError || alert.isError) {
    return {
      state: 'error' as const,
      street,
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
  const hours = (new Date(windowEnd).getTime() - new Date(windowStart).getTime()) / 3_600_000;

  return {
    state: 'ready' as const,
    street,
    hours,
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
