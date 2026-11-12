/**
 * End-to-end check of the API against a running Worker and the real database.
 *
 *   terminal 1:  pnpm dev:api
 *   terminal 2:  pnpm --filter @kapitwatt/api e2e     (run under `doppler run --` for DATABASE_URL)
 *
 * API_URL defaults to http://localhost:8787. Every household it creates has a meter serial starting
 * with E2E- and is deleted at the end, pass or fail. Grows with each API phase.
 */
import { createHash } from 'node:crypto';
import { createDb } from '@kapitwatt/db';
import { ApiErrorBody, HouseholdMe, RegisterResult } from '@kapitwatt/shared';

const API = process.env.API_URL ?? 'http://localhost:8787';
const db = createDb(process.env.DATABASE_URL ?? '');
const RUN = `E2E-${Date.now()}`;

let passed = 0;
function check(cond: unknown, what: string): asserts cond {
  if (!cond) throw new Error(`FAILED: ${what}`);
  passed++;
  console.log(`  ok  ${what}`);
}

async function call(
  method: string,
  path: string,
  body?: unknown,
  headers: Record<string, string> = {},
) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { ...(body === undefined ? {} : { 'content-type': 'application/json' }), ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, headers: res.headers, json: text ? JSON.parse(text) : null };
}

const bearer = (token: string) => ({ authorization: `Bearer ${token}` });
const errorCode = (json: unknown) => ApiErrorBody.parse(json).error.code;

async function phase1Households() {
  console.log('phase 1: households');
  const health = await call('GET', '/health');
  check(health.status === 200, 'GET /health is up');

  const { json: list } = await call('GET', '/barangays');
  const barangay = (list.barangays as { id: string; municipality: string }[]).find(
    (b) => b.municipality === 'Santa Cruz',
  );
  check(barangay, 'a Santa Cruz barangay exists');

  const signup = {
    barangayId: barangay.id,
    meterType: 'standard',
    meterSerial: `${RUN}-A`,
    billAvgKwhMonth: 450,
    lat: 14.2814,
    lng: 121.4161,
    consent: true,
    pushToken: `ExponentPushToken[${RUN}]`,
  };
  const reg = await call('POST', '/auth/register', signup);
  check(reg.status === 201, 'POST /auth/register returns 201');
  const { token, household } = RegisterResult.parse(reg.json);
  check(/^kw_[A-Za-z0-9_-]{43}$/.test(token), 'token has the kw_ format');
  check(household.path === 'photo' && household.needsRehearsal, 'photo household must rehearse');
  check(household.commitCapKw === null, 'no commit cap before a baseline');

  const [stored] =
    await db`select auth_token_hash, consent_at, opted_in from households where id = ${household.id}`;
  check(
    stored?.auth_token_hash === createHash('sha256').update(token).digest('hex'),
    'database stores only the token hash',
  );
  check(stored?.consent_at && stored?.opted_in === true, 'consent time and opt-in recorded');

  const me = await call('GET', '/auth/me', undefined, bearer(token));
  check(
    me.status === 200 && HouseholdMe.parse(me.json).id === household.id,
    'GET /auth/me with token',
  );
  check((await call('GET', '/auth/me')).status === 401, 'GET /auth/me without token is 401');
  check(
    (await call('GET', '/auth/me', undefined, bearer(`kw_${'A'.repeat(43)}`))).status === 401,
    'GET /auth/me with an unknown token is 401',
  );

  const badBarangay = await call('POST', '/auth/register', {
    ...signup,
    meterSerial: `${RUN}-X`,
    barangayId: '00000000-0000-4000-8000-000000000000',
  });
  check(
    badBarangay.status === 422 && errorCode(badBarangay.json) === 'unknown_barangay',
    'unknown barangay is 422',
  );
  const noConsent = await call('POST', '/auth/register', { ...signup, consent: false });
  check(noConsent.status === 400, 'registration without consent is 400');

  const push = await call(
    'PUT',
    '/auth/push-token',
    { pushToken: `ExponentPushToken[${RUN}-2]` },
    bearer(token),
  );
  check(push.status === 204, 'PUT /auth/push-token returns 204');

  // A second household on the same phone takes over the push token; the first loses it.
  const second = await call('POST', '/auth/register', {
    ...signup,
    meterType: 'ami',
    meterSerial: `${RUN}-B`,
    pushToken: `ExponentPushToken[${RUN}-2]`,
  });
  check(second.status === 201, 'second household registers');
  check(
    RegisterResult.parse(second.json).household.needsRehearsal === false,
    'smart meter skips rehearsal',
  );
  const [first] = await db`select push_token from households where id = ${household.id}`;
  check(first?.push_token === null, 'push token moved to the newest household on that phone');
}

async function cleanup() {
  const removed =
    await db`delete from households where meter_serial like ${`${RUN}%`} and not is_simulated returning id`;
  console.log(`cleanup: removed ${removed.length} test household(s)`);
}

try {
  await phase1Households();
  console.log(`\nall ${passed} checks passed`);
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
} finally {
  await cleanup();
}
