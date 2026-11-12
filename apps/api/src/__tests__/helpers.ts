import type { Bindings } from '../env';
import { app } from '../index';

/** Long random-looking keys that pass isStrongKey. Test values only. */
export const OPERATOR_KEY = `op_${'b'.repeat(40)}`;
export const SIM_KEY = `sim_${'a'.repeat(40)}`;
export const DASHBOARD_ORIGIN = 'http://localhost:8081';

export function testEnv(overrides: Partial<Bindings> = {}): Bindings {
  return {
    APP_ENV: 'demo',
    ALLOWED_ORIGINS: DASHBOARD_ORIGIN,
    // Never contacted: these tests only cover paths that fail before the database.
    DATABASE_URL: 'postgresql://user:pass@ep-test-pooler.example.neon.tech/db',
    SIM_KEY,
    OPERATOR_KEY,
    ...overrides,
  };
}

/** A minimal ExecutionContext that collects waitUntil promises. */
export function fakeCtx() {
  const pending: Promise<unknown>[] = [];
  const ctx = {
    waitUntil: (p: Promise<unknown>) => void pending.push(p),
    passThroughOnException: () => {},
    props: {},
  } as unknown as ExecutionContext;
  return { ctx, pending };
}

export function call(path: string, init: RequestInit = {}, env: Bindings = testEnv()) {
  return app.request(path, init, env, fakeCtx().ctx);
}

export function json(body: unknown, headers: Record<string, string> = {}): RequestInit {
  return {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  };
}
