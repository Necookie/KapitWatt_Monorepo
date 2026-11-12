/**
 * Thin fetch wrapper. Both Expo apps read the same env var: EXPO_PUBLIC_API_URL.
 * Type request and response bodies with the Zod schemas from @kapitwatt/shared.
 */
import * as SecureStore from 'expo-secure-store';
import { MOCK } from '@/api/config';

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

/** The API's own sentence for a failed call ("Take the second photo in 12 minutes."), or null. */
export function errorMessage(e: unknown): string | null {
  if (!(e instanceof ApiError)) return null;
  const message = (e.body as { error?: { message?: unknown } } | null)?.error?.message;
  return typeof message === 'string' && message.length > 0 ? message : null;
}

/**
 * A sentence for any failed call: the given text for known codes, then what the kind of failure
 * says about itself, then the fallback. Keeps "check your connection" for real connection problems.
 */
export function describeError(e: unknown, known: Record<string, string>, fallback: string): string {
  const code = errorCode(e);
  if (code && known[code]) return known[code];
  if (e instanceof ApiError) {
    if (e.status === 429) return 'Too many tries from this network. Wait a minute, then try again.';
    if (e.status >= 500) return 'The server had a problem. Try again in a moment.';
    return errorMessage(e) ?? fallback;
  }
  // The server answered, but not in the shape this version of the app expects.
  if (e instanceof Error && e.name === 'ZodError') {
    return 'The server is on a different version than this app. Ask the KapitWatt team to update it.';
  }
  // No answer at all. React Native's fetch threw TypeError; SDK 58's (expo/fetch) throws its own
  // FetchError, which is not exported and keeps the name "Error", but always starts its message so.
  if (e instanceof TypeError || (e instanceof Error && e.message.startsWith('fetch failed:'))) {
    return 'Cannot reach the server. Check your internet connection.';
  }
  return fallback;
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
  if (!res.ok) {
    const error = new ApiError(res.status, body);
    // The server no longer accepts our token (logged in on another phone, or account deleted):
    // forget it, so the app goes back to the welcome screen instead of failing on every call.
    if (res.status === 401 && token !== null && errorCode(error) === 'unauthorized') {
      setAuthToken(null);
    }
    throw error;
  }
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
