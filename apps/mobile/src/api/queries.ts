import {
  POLL_INTERVAL_MS,
  type CreateCommitmentInput,
  type LoginInput,
  type RegisterHouseholdInput,
  type SubmitReadingInput,
  type UpdateProfileInput,
} from '@kapitwatt/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as endpoints from '@/api/endpoints';
import { forgetPush, registerForPush } from '@/api/push';

/** One place for query keys so invalidation always hits the right cache entries. */
export const queryKeys = {
  me: ['me'] as const,
  activeAlert: ['alerts', 'active'] as const,
  alert: (id: string) => ['alerts', id] as const,
  totals: (id: string) => ['alerts', id, 'totals'] as const,
  myStatus: (id: string) => ['alerts', id, 'my-status'] as const,
  result: (id: string) => ['alerts', id, 'result'] as const,
  barangays: ['barangays'] as const,
  leaderboard: ['barangays', 'leaderboard'] as const,
  history: ['history'] as const,
};

export const useMe = () => useQuery({ queryKey: queryKeys.me, queryFn: endpoints.getMe });

export const useActiveAlert = () =>
  useQuery({ queryKey: queryKeys.activeAlert, queryFn: endpoints.getActiveAlert });

/** The event screen polls every POLL_INTERVAL_MS (about 2 s) for status and progress (FR-APP-18). */
export const useAlert = (id: string) =>
  useQuery({
    queryKey: queryKeys.alert(id),
    queryFn: () => endpoints.getAlert(id),
    refetchInterval: POLL_INTERVAL_MS,
  });

export const useAlertTotals = (id: string) =>
  useQuery({
    queryKey: queryKeys.totals(id),
    queryFn: () => endpoints.getAlertTotals(id),
    refetchInterval: POLL_INTERVAL_MS,
  });

export const useMyEventStatus = (id: string) =>
  useQuery({
    queryKey: queryKeys.myStatus(id),
    queryFn: () => endpoints.getMyEventStatus(id),
    refetchInterval: POLL_INTERVAL_MS,
  });

export const useResult = (id: string) =>
  useQuery({ queryKey: queryKeys.result(id), queryFn: () => endpoints.getResult(id) });

export function useCommit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCommitmentInput) => endpoints.createCommitment(input),
    onSuccess: (_c, input) => {
      void qc.invalidateQueries({ queryKey: queryKeys.myStatus(input.alertId) });
      void qc.invalidateQueries({ queryKey: queryKeys.totals(input.alertId) });
    },
  });
}

export const useBarangays = () =>
  useQuery({ queryKey: queryKeys.barangays, queryFn: endpoints.getBarangays });

export const useLeaderboard = () =>
  useQuery({ queryKey: queryKeys.leaderboard, queryFn: endpoints.getLeaderboard });

export const useHistory = () =>
  useQuery({ queryKey: queryKeys.history, queryFn: endpoints.getHistory });

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RegisterHouseholdInput) => endpoints.register(input),
    // Reset, not just invalidate: cached 401s would otherwise send Home straight back to sign-up.
    onSuccess: () => {
      void registerForPush();
      void qc.resetQueries();
    },
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginInput) => endpoints.login(input),
    onSuccess: () => {
      void registerForPush();
      // Not awaited: the screen moves on at once and the queries refill behind it.
      void qc.resetQueries();
    },
  });
}

/** Signing out or deleting the account clears every cached answer about the household. */
export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => endpoints.logout(),
    onSettled: () => {
      forgetPush();
      qc.clear();
    },
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (password: string) => endpoints.deleteAccount(password),
    onSuccess: () => {
      forgetPush();
      qc.clear();
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProfileInput) => endpoints.updateProfile(input),
    onSuccess: (me) => qc.setQueryData(queryKeys.me, me),
  });
}

export function useSubmitReading() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { input: SubmitReadingInput; photoUri: string }) =>
      endpoints.submitReading(args.input, args.photoUri),
    onSuccess: () => qc.invalidateQueries(),
  });
}

/** Refetch everything (pull to refresh, and after the mock fast-forward). */
export function useRefreshAll() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries();
}
