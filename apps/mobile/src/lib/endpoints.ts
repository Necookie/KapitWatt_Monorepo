import {
  AlertTotals,
  AlertView,
  Commitment,
  MeResponse,
  MyEventStatus,
  ResultCard,
  type CreateCommitmentInput,
} from '@kapitwatt/shared';
import { api, ApiError } from './api';
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

export async function getMe(): Promise<MeResponse> {
  return synced(USE_MOCKS ? await mock.getMe() : await get(MeResponse, '/auth/me'));
}

export async function getActiveAlert(): Promise<AlertView | null> {
  return synced(
    USE_MOCKS ? await mock.getActiveAlert() : await get(AlertView.nullable(), '/alerts/active'),
  );
}

export async function getAlert(id: string): Promise<AlertView> {
  return synced(USE_MOCKS ? await mock.getAlert(id) : await get(AlertView, `/alerts/${id}`));
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
export async function getResult(alertId: string): Promise<ResultCard | null> {
  if (USE_MOCKS) return mock.getResult(alertId);
  try {
    return await get(ResultCard, `/rewards/by-alert/${alertId}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}
