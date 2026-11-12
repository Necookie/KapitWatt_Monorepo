import { ApiErrorBody } from '@kapitwatt/shared';
import { describe, expect, it } from 'vitest';
import { HOUSEHOLD_TOKEN_PATTERN, isStrongKey, newHouseholdToken, safeEqual } from '../lib/crypto';
import { call, DASHBOARD_ORIGIN, json, OPERATOR_KEY, SIM_KEY, testEnv } from './helpers';

const validAlert = {
  level: 'red',
  windowStart: '2026-11-12T10:00:00.000Z',
  windowEnd: '2026-11-12T12:00:00.000Z',
  targetKw: 600,
  targetBarangayIds: [],
  message: 'Red alert test',
};

async function expectError(res: Response, status: number, code: string) {
  expect(res.status).toBe(status);
  const body = ApiErrorBody.parse(await res.json());
  expect(body.error.code).toBe(code);
  expect(body.error.requestId).toBe(res.headers.get('x-request-id'));
  expect(JSON.stringify(body)).not.toMatch(/stack|at .*\.ts/);
  return body;
}

describe('crypto helpers', () => {
  it('issues kw_ tokens with 256 bits of randomness', () => {
    const a = newHouseholdToken();
    const b = newHouseholdToken();
    expect(a).toMatch(HOUSEHOLD_TOKEN_PATTERN);
    expect(a).not.toBe(b);
  });

  it('compares keys in constant time, whatever their length', async () => {
    expect(await safeEqual(OPERATOR_KEY, OPERATOR_KEY)).toBe(true);
    expect(await safeEqual(OPERATOR_KEY, `${OPERATOR_KEY}x`)).toBe(false);
    expect(await safeEqual('', OPERATOR_KEY)).toBe(false);
  });

  it('rejects weak shared keys', () => {
    expect(isStrongKey('change-me')).toBe(false);
    expect(isStrongKey('short')).toBe(false);
    expect(isStrongKey(undefined)).toBe(false);
    expect(isStrongKey(OPERATOR_KEY)).toBe(true);
  });
});

describe('baseline headers and errors', () => {
  it('sets security headers, no-store and a request id', async () => {
    const res = await call('/health');
    expect(res.status).toBe(200);
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('x-frame-options')).toBe('DENY');
    expect(res.headers.get('strict-transport-security')).toContain('max-age=');
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(res.headers.get('x-request-id')).toBeTruthy();
    expect(res.headers.get('x-powered-by')).toBeNull();
  });

  it('reports weak configuration by name only', async () => {
    const res = await call('/health', {}, testEnv({ OPERATOR_KEY: 'change-me' }));
    const body = (await res.json()) as { config: string; missing: string[] };
    expect(body.config).toBe('misconfigured');
    expect(body.missing).toEqual(['OPERATOR_KEY']);
    expect(JSON.stringify(body)).not.toContain('change-me');
  });

  it('returns the JSON envelope for unknown routes', async () => {
    await expectError(await call('/nope'), 404, 'not_found');
  });

  it('turns malformed JSON into a 400, not a 500', async () => {
    const res = await call('/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{bad json',
    });
    await expectError(res, 400, 'bad_request');
  });

  it('rejects oversized JSON bodies with 413', async () => {
    const res = await call('/auth/register', json({ pad: 'x'.repeat(20_000) }));
    await expectError(res, 413, 'payload_too_large');
  });

  it('validates bodies and lists the failing fields', async () => {
    const res = await call('/auth/register', json({ consent: false }));
    const body = await expectError(res, 400, 'invalid_request');
    const paths = body.error.issues?.map((i) => i.path) ?? [];
    expect(paths).toEqual(expect.arrayContaining(['barangayId', 'consent', 'meterSerial']));
  });
});

describe('CORS', () => {
  const preflight = (origin: string) =>
    call('/alerts', {
      method: 'OPTIONS',
      headers: { origin, 'access-control-request-method': 'POST' },
    });

  it('allows the dashboard origin', async () => {
    const res = await preflight(DASHBOARD_ORIGIN);
    expect(res.headers.get('access-control-allow-origin')).toBe(DASHBOARD_ORIGIN);
  });

  it('does not allow other origins', async () => {
    const res = await preflight('https://evil.example');
    expect(res.headers.get('access-control-allow-origin')).toBeNull();
  });
});

describe('household auth', () => {
  it('needs a bearer token', async () => {
    await expectError(await call('/auth/me'), 401, 'unauthorized');
  });

  it('rejects malformed tokens without touching the database', async () => {
    const res = await call('/auth/me', { headers: { authorization: 'Bearer not-a-token' } });
    await expectError(res, 401, 'unauthorized');
  });
});

describe('operator auth', () => {
  it('needs the operator key', async () => {
    await expectError(await call('/alerts', json(validAlert)), 401, 'unauthorized');
  });

  it('rejects a wrong key', async () => {
    const res = await call('/alerts', json(validAlert, { 'x-operator-key': `${OPERATOR_KEY}x` }));
    await expectError(res, 401, 'unauthorized');
  });

  it('is switched off when the server key is weak', async () => {
    const res = await call(
      '/alerts',
      json(validAlert, { 'x-operator-key': 'change-me' }),
      testEnv({ OPERATOR_KEY: 'change-me' }),
    );
    await expectError(res, 503, 'misconfigured');
  });

  it('lets the right key through to validation', async () => {
    const res = await call(
      '/alerts',
      json(
        { ...validAlert, windowEnd: validAlert.windowStart },
        { 'x-operator-key': OPERATOR_KEY },
      ),
    );
    await expectError(res, 400, 'invalid_request');
  });
});

describe('simulator routes', () => {
  it('do not exist outside the demo environment', async () => {
    const res = await call(
      '/sim/status',
      { headers: { 'x-sim-key': SIM_KEY } },
      testEnv({ APP_ENV: 'production' }),
    );
    await expectError(res, 404, 'not_found');
  });

  it('need the simulator key', async () => {
    await expectError(await call('/sim/status'), 401, 'unauthorized');
  });

  it('do not accept the operator key', async () => {
    const res = await call('/sim/status', { headers: { 'x-sim-key': OPERATOR_KEY } });
    await expectError(res, 401, 'unauthorized');
  });
});

describe('uuidFromName', () => {
  it('is stable, distinct per name, and a valid UUID', async () => {
    const { uuidFromName } = await import('../lib/crypto');
    const a = await uuidFromName('kapitwatt-sim:2026:SIM-SAN-0001');
    expect(a).toBe(await uuidFromName('kapitwatt-sim:2026:SIM-SAN-0001'));
    expect(a).not.toBe(await uuidFromName('kapitwatt-sim:2027:SIM-SAN-0001'));
    expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-8[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});
