import {
  ActiveAlertResponse,
  AlertTotals,
  AlertView,
  Barangay,
  CommitmentView,
  HistoryResponse,
  HouseholdMe,
  LeaderboardResponse,
  RegisterResult,
  ResultCard,
  SubmitReadingResult,
  type Commitment,
  type CreateCommitmentInput,
  type LeaderboardEntry,
  type MockAlertView,
  type MockHistoryItem,
  type MockResultCard,
  type MyEventStatus,
  type RegisterHouseholdInput,
  type SubmitReadingInput,
  type SubmitReadingResponse,
} from '@kapitwatt/shared';
import {
  notCommittedStatus,
  toAlertView,
  toCommitment,
  toEventStatus,
  toHistoryItem,
  toLeaderboard,
  toResultCard,
  toSubmittedReading,
} from './adapters';
import { api, ApiError, errorCode, setAuthToken } from './api';
import { MOCK } from './config';
import * as mock from './mock';
import { serverNow, syncServerTime } from './serverTime';

/**
 * Every API call the household app makes, in one place. Screens never call api() directly:
 * they use the hooks in ./queries, which call these. Real responses are validated with the shared
 * Zod schemas so a contract mismatch with the API fails loudly instead of rendering blanks, then
 * converted in ./adapters to the shapes the screens were built on.
 */

async function get<T>(schema: { parse(body: unknown): T }, path: string): Promise<T> {
  return schema.parse(await api(path));
}

function synced<T extends { serverTime: string } | null>(body: T): T {
  if (body) syncServerTime(body.serverTime);
  return body;
}

const serverNowIso = () => new Date(serverNow()).toISOString();

export async function getMe(): Promise<HouseholdMe> {
  return MOCK.account ? mock.getMe() : get(HouseholdMe, '/auth/me');
}

export async function getActiveAlert(): Promise<MockAlertView | null> {
  if (MOCK.events) return synced(await mock.getActiveAlert());
  const { alert } = await get(ActiveAlertResponse, '/alerts/active');
  return synced(alert ? toAlertView(alert) : null);
}

export async function getAlert(id: string): Promise<MockAlertView> {
  if (MOCK.events) return synced(await mock.getAlert(id));
  return synced(toAlertView(await get(AlertView, `/alerts/${id}`)));
}

export async function getAlertTotals(id: string): Promise<AlertTotals> {
  return MOCK.events ? mock.getAlertTotals(id) : get(AlertTotals, `/alerts/${id}/totals`);
}

export async function getMyEventStatus(alertId: string): Promise<MyEventStatus> {
  if (MOCK.events) return synced(await mock.getMyEventStatus(alertId));
  try {
    return synced(toEventStatus(await get(CommitmentView, `/commitments/by-alert/${alertId}`)));
  } catch (e) {
    // Before the household commits there is nothing to show yet; that is not an error.
    if (errorCode(e) === 'not_committed') return notCommittedStatus(serverNowIso());
    throw e;
  }
}

export async function createCommitment(input: CreateCommitmentInput): Promise<Commitment> {
  if (MOCK.events) return mock.createCommitment(input);
  return toCommitment(
    CommitmentView.parse(
      await api('/commitments', { method: 'POST', body: JSON.stringify(input) }),
    ),
  );
}

/** null until settlement has run (the API answers 404). */
export async function getResult(alertId: string): Promise<MockResultCard | null> {
  if (MOCK.results) return mock.getResult(alertId);
  try {
    return toResultCard(await get(ResultCard, `/rewards/by-alert/${alertId}`));
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export async function getBarangays(): Promise<Barangay[]> {
  if (MOCK.account) return mock.getBarangays();
  // The API wraps the list: { barangays: [...] }.
  const body = await api<{ barangays?: unknown } | null>('/barangays');
  return Barangay.array().parse(body?.barangays);
}

/** Sign up and opt in. Keeps the token for later calls (in secure storage; see ./api). */
export async function register(input: RegisterHouseholdInput): Promise<RegisterResult> {
  const res = MOCK.account
    ? await mock.register(input)
    : RegisterResult.parse(
        await api('/auth/register', { method: 'POST', body: JSON.stringify(input) }),
      );
  setAuthToken(res.token);
  return res;
}

/** Store or refresh this phone's Expo push token (FR-APP-05). The API answers 204. */
export async function savePushToken(pushToken: string): Promise<void> {
  if (MOCK.account) return;
  await api('/auth/push-token', { method: 'PUT', body: JSON.stringify({ pushToken }) });
}

/** Meter photo plus typed reading, sent as multipart form data (FR-APP-12). */
export async function submitReading(
  input: SubmitReadingInput,
  photoUri: string,
): Promise<SubmitReadingResponse> {
  if (MOCK.readings) return mock.submitReading(input, photoUri);
  const form = new FormData();
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) form.append(key, String(value));
  }
  // React Native's FormData takes a file descriptor object instead of a Blob.
  form.append('photo', { uri: photoUri, name: 'meter.jpg', type: 'image/jpeg' } as unknown as Blob);
  const result = SubmitReadingResult.parse(await api('/readings', { method: 'POST', body: form }));
  return toSubmittedReading(result, input, serverNowIso());
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  if (MOCK.results) return mock.getLeaderboard();
  return toLeaderboard((await get(LeaderboardResponse, '/barangays/leaderboard')).leaderboard);
}

export async function getHistory(): Promise<MockHistoryItem[]> {
  if (MOCK.results) return mock.getHistory();
  return (await get(HistoryResponse, '/commitments/history')).history.map(toHistoryItem);
}
