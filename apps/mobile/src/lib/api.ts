/**
 * Thin fetch wrapper. Both Expo apps read the same env var: EXPO_PUBLIC_API_URL.
 * Type request and response bodies with the Zod schemas from @kapitwatt/shared.
 */
import * as SecureStore from 'expo-secure-store';
import { MOCK } from './config';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8787';

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(`API ${status}`);
  }
}

/**
 * The machine-readable code of a failed call. The API sends `{ error: { code, message } }`
 * (ApiErrorBody in @kapitwatt/shared); the mock sends `{ error: 'code' }`.
 */
export function errorCode(e: unknown): string | null {
  if (!(e instanceof ApiError)) return null;
  const error = (e.body as { error?: unknown } | null)?.error;
  if (typeof error === 'string') return error;
  const code = (error as { code?: unknown } | null | undefined)?.code;
  return typeof code === 'string' ? code : null;
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isForm = init.body instanceof FormData;
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(isForm ? {} : { 'content-type': 'application/json' }),
      ...authHeaders(),
      ...init.headers,
    },
  });
  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, body);
  return body as T;
}
const TOKEN_KEY = 'kapitwatt.householdToken';

/** The token saved by an earlier sign-up on this phone. The mock's token is never stored. */
function storedToken(): string | null {
  if (MOCK.account) return null;
  try {
    return SecureStore.getItem(TOKEN_KEY);
  } catch {
    // No secure storage (web preview): the household signs up again each session.
    return null;
  }
}

let token: string | null = storedToken();

/** True once this phone holds a household token (signed up now or in an earlier session). */
export const hasAuthToken = () => token !== null;

/**
 * Household bearer token from POST /auth/register. The API shows it once, so it is kept in secure
 * storage and survives an app restart.
 */
export function setAuthToken(next: string | null) {
  token = next;
  if (MOCK.account) return;
  const saved = next
    ? SecureStore.setItemAsync(TOKEN_KEY, next)
    : SecureStore.deleteItemAsync(TOKEN_KEY);
  // Still signed in for this session if the write fails.
  saved.catch(() => undefined);
}

function authHeaders(): Record<string, string> {
  return token ? { authorization: `Bearer ${token}` } : {};
}
