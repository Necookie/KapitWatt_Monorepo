/**
 * Thin fetch wrapper. Both Expo apps read the same env var: EXPO_PUBLIC_API_URL.
 * Type request and response bodies with the Zod schemas from @kapitwatt/shared.
 */
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8787';

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(`API ${status}`);
  }
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
let token: string | null = null;

/** Household bearer token from POST /auth/register. Persist it with expo-secure-store. */
export function setAuthToken(next: string | null) {
  token = next;
}

function authHeaders(): Record<string, string> {
  return token ? { authorization: `Bearer ${token}` } : {};
}
