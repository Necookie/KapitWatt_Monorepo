import { POLL_INTERVAL_MS } from '@kapitwatt/shared';
import { useIsMutating, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from './http';
import { client } from './client';

/** Live figures refresh by short polling (FR-DASH-10). Spread into every polled query. */
export const live = { refetchInterval: POLL_INTERVAL_MS, retry: false } as const;

export const keys = {
  barangays: ['barangays'] as const,
  alert: ['alert', 'current'] as const,
  alertLog: ['alert', 'log'] as const,
  totals: (alertId: string) => ['alert', alertId, 'totals'] as const,
  flagged: ['readings', 'flagged'] as const,
  simStatus: ['sim', 'status'] as const,
  analytics: (alertId: string) => ['analytics', alertId] as const,
  alertHistory: ['analytics', 'history'] as const,
};

export function useBarangays() {
  return useQuery({ queryKey: keys.barangays, queryFn: client.listBarangays, ...live });
}

export function useCurrentAlert() {
  return useQuery({ queryKey: keys.alert, queryFn: client.getCurrentAlert, ...live });
}

export function useTotals(alertId: string | undefined) {
  return useQuery({
    queryKey: keys.totals(alertId ?? 'none'),
    queryFn: () => client.getTotals(alertId!),
    enabled: Boolean(alertId),
    ...live,
  });
}

export function useAlertHistory() {
  return useQuery({ queryKey: keys.alertHistory, queryFn: client.getAlertHistory, ...live });
}

export function useSimStatus() {
  return useQuery({ queryKey: keys.simStatus, queryFn: client.simStatus, ...live });
}

/**
 * FR-DASH-07: the stage controls and the simulator exist in the demo environment only.
 * The API answers 404 on /sim/status outside it, so that is what switches them off here.
 * Any other failure (a missing key, a dropped connection) leaves them on and shows its own error.
 * Until the first answer arrives they stay off, so they never flash up outside the demo.
 */
export function useDemoControls(): boolean {
  const sim = useSimStatus();
  if (sim.error instanceof ApiError && sim.error.status === 404) return false;
  if (sim.data) return sim.data.enabled;
  return sim.isError;
}

/** Refetch everything on screen straight after an action instead of waiting for the next poll. */
export function useRefreshAll() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries();
}

export function useAction<TInput, TOutput>(
  action: (input: TInput) => Promise<TOutput>,
  mutationKey?: readonly string[],
) {
  const refresh = useRefreshAll();
  return useMutation({ mutationFn: action, onSettled: refresh, mutationKey });
}

/** The paced commit run, keyed so other screens can tell it is still going. */
export const SIM_COMMIT_RUN = ['sim', 'run', 'commit'] as const;

export function useCommitRunInProgress(): boolean {
  return useIsMutating({ mutationKey: SIM_COMMIT_RUN }) > 0;
}
