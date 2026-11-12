import {
  AlertTotals,
  MockAlertView,
  Barangay,
  Commitment,
  HouseholdMe,
  MockHistoryItem,
  LeaderboardEntry,
  MyEventStatus,
  RegisterResult,
  MockResultCard,
  SubmitReadingResponse,
  type CreateCommitmentInput,
  type RegisterHouseholdInput,
  type SubmitReadingInput,
} from '@kapitwatt/shared';
import { api, ApiError, setAuthToken } from './api';
import { USE_MOCKS } from './config';
import * as mock from './mock';
import { syncServerTime } from './serverTime';

/**
 * Every API call the household app makes, in one place. Screens never call api() directly:
 * they use the hooks in ./queries, which call these. Real responses are validated with the shared
 * Zod schemas so a contract mismatch with the API fails loudly instead of rendering blanks.
 */

async function get<T>(schema: { parse(body: unknown): T }, path: string): Promise<T> {
  return schema.parse(await api(path));
}

function synced<T extends { serverTime: string } | null>(body: T): T {
  if (body) syncServerTime(body.serverTime);
  return body;
}

export async function getMe(): Promise<HouseholdMe> {
  return USE_MOCKS ? mock.getMe() : get(HouseholdMe, '/auth/me');
}

export async function getActiveAlert(): Promise<MockAlertView | null> {
  return synced(
    USE_MOCKS ? await mock.getActiveAlert() : await get(MockAlertView.nullable(), '/alerts/active'),
  );
}

export async function getAlert(id: string): Promise<MockAlertView> {
  return synced(USE_MOCKS ? await mock.getAlert(id) : await get(MockAlertView, `/alerts/${id}`));
}

export async function getAlertTotals(id: string): Promise<AlertTotals> {
  return USE_MOCKS ? mock.getAlertTotals(id) : get(AlertTotals, `/alerts/${id}/totals`);
}

export async function getMyEventStatus(alertId: string): Promise<MyEventStatus> {
  return synced(
    USE_MOCKS
      ? await mock.getMyEventStatus(alertId)
      : await get(MyEventStatus, `/commitments/by-alert/${alertId}`),
  );
}

export async function createCommitment(input: CreateCommitmentInput): Promise<Commitment> {
  if (USE_MOCKS) return mock.createCommitment(input);
  return Commitment.parse(
    await api('/commitments', { method: 'POST', body: JSON.stringify(input) }),
  );
}

/** null until settlement has run (the API answers 404). */
export async function getResult(alertId: string): Promise<MockResultCard | null> {
  if (USE_MOCKS) return mock.getResult(alertId);
  try {
    return await get(MockResultCard, `/rewards/by-alert/${alertId}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export async function getBarangays(): Promise<Barangay[]> {
  if (USE_MOCKS) return mock.getBarangays();
  // The API wraps the list: { barangays: [...] }.
  const body = await api<{ barangays?: unknown } | null>('/barangays');
  return Barangay.array().parse(body?.barangays);
}

/** Sign up and opt in. Keeps the token for later calls (in memory only for now; see config). */
export async function register(input: RegisterHouseholdInput): Promise<RegisterResult> {
  const res = USE_MOCKS
    ? await mock.register(input)
    : RegisterResult.parse(
        await api('/auth/register', { method: 'POST', body: JSON.stringify(input) }),
      );
  setAuthToken(res.token);
  return res;
}

/** Meter photo plus typed reading, sent as multipart form data (FR-APP-12). */
export async function submitReading(
  input: SubmitReadingInput,
  photoUri: string,
): Promise<SubmitReadingResponse> {
  if (USE_MOCKS) return mock.submitReading(input, photoUri);
  const form = new FormData();
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) form.append(key, String(value));
  }
  // React Native's FormData takes a file descriptor object instead of a Blob.
  form.append('photo', { uri: photoUri, name: 'meter.jpg', type: 'image/jpeg' } as unknown as Blob);
  return SubmitReadingResponse.parse(await api('/readings', { method: 'POST', body: form }));
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  return USE_MOCKS
    ? mock.getLeaderboard()
    : get(LeaderboardEntry.array(), '/barangays/leaderboard');
}

export async function getHistory(): Promise<MockHistoryItem[]> {
  return USE_MOCKS ? mock.getHistory() : get(MockHistoryItem.array(), '/commitments/history');
}
