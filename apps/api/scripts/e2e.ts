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
import {
  ActiveAlertResponse,
  AlertLogResponse,
  AlertTargetsResponse,
  AlertTotals,
  AlertView,
  ApiErrorBody,
  HouseholdMe,
  RegisterResult,
} from '@kapitwatt/shared';

const API = process.env.API_URL ?? 'http://localhost:8787';
/** Must match the Worker's OPERATOR_KEY (both come from the environment). */
const OPERATOR = { 'x-operator-key': process.env.OPERATOR_KEY ?? '' };
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
  const all = list.barangays as { id: string; municipality: string }[];
  check(all.length === 21, 'GET /barangays lists the 21 pilot barangays');
  check(
    (list.barangays as { optedInHouseholds?: number }[]).every(
      (b) => typeof b.optedInHouseholds === 'number',
    ),
    'each barangay carries its opted-in household count',
  );
  // Use a barangay where no real phone is registered, so the phase 2 push cannot reach anyone.
  const quiet = new Set(
    (
      await db`select b.id from barangays b where not exists (
        select 1 from households h where h.barangay_id = b.id and not h.is_simulated
          and h.push_token is not null and h.meter_serial not like 'E2E-%')`
    ).map((r) => r.id as string),
  );
  const barangay = all.find((b) => quiet.has(b.id));
  check(barangay, 'a barangay with no real phones exists');

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
  const secondId = RegisterResult.parse(second.json).household.id;
  return { token, barangayId: barangay.id, pushHouseholdId: secondId };
}

async function phase2Alerts(ctx: Awaited<ReturnType<typeof phase1Households>>) {
  console.log('phase 2: alerts');
  check(OPERATOR['x-operator-key'].length >= 32, 'OPERATOR_KEY is set for the test');
  const inMinutes = (m: number) => new Date(Date.now() + m * 60_000).toISOString();
  const alertBody = {
    level: 'red',
    windowStart: inMinutes(2),
    windowEnd: inMinutes(122),
    targetKw: 10,
    targetBarangayIds: [ctx.barangayId],
    message: `${RUN} e2e red alert (test, ignore)`,
  };
  const key = { 'idempotency-key': `${RUN}-key-1` };

  const created = await call('POST', '/alerts', alertBody, { ...OPERATOR, ...key });
  check(created.status === 201, 'POST /alerts returns 201');
  const alert = AlertView.parse(created.json);
  check(
    alert.status === 'active' && alert.createdBy === 'operator',
    'alert is active, sender logged',
  );
  check(alert.targetBarangayIds.length === 1, 'targets only the requested barangay');

  const replay = await call('POST', '/alerts', alertBody, { ...OPERATOR, ...key });
  check(
    replay.status === 200 && AlertView.parse(replay.json).id === alert.id,
    'same Idempotency-Key returns the same alert (200), nothing new sent',
  );

  const get = await call('GET', `/alerts/${alert.id}`);
  check(
    get.status === 200 && AlertView.parse(get.json).serverNow,
    'GET /alerts/:id with serverNow',
  );

  const totals = AlertTotals.parse((await call('GET', `/alerts/${alert.id}/totals`)).json);
  check(
    totals.committedKw === 0 &&
      totals.barangays.length === 1 &&
      totals.barangays[0]?.targetKw === 10,
    'totals: 0 kW committed, whole target on the one barangay',
  );
  check(
    totals.status === 'active' &&
      totals.barangays[0]?.households === 2 &&
      totals.deliveredAmiKw === 0,
    'totals carry status, opted-in households (the 2 test households) and the path split',
  );

  const override = await call(
    'PUT',
    `/alerts/${alert.id}/targets`,
    { targets: [{ barangayId: ctx.barangayId, targetKw: 4 }] },
    OPERATOR,
  );
  const targets = AlertTargetsResponse.parse(override.json).targets;
  check(
    override.status === 200 && targets[0]?.targetKw === 4 && targets[0]?.isOverride,
    'operator override stored',
  );
  const outside = await call(
    'PUT',
    `/alerts/${alert.id}/targets`,
    { targets: [{ barangayId: '00000000-0000-4000-8000-000000000000', targetKw: 1 }] },
    OPERATOR,
  );
  check(
    outside.status === 422 && errorCode(outside.json) === 'not_targeted',
    'override outside the alert is 422',
  );

  const active = ActiveAlertResponse.parse(
    (await call('GET', '/alerts/active', undefined, bearer(ctx.token))).json,
  );
  check(active.alert?.id === alert.id, 'GET /alerts/active shows the household its barangay alert');

  const log = AlertLogResponse.parse(
    (await call('GET', '/alerts?limit=5', undefined, OPERATOR)).json,
  );
  check(
    log.alerts.some((a) => a.id === alert.id),
    'alert log lists it',
  );

  const past = await call(
    'POST',
    '/alerts',
    { ...alertBody, windowStart: inMinutes(-180), windowEnd: inMinutes(-60) },
    OPERATOR,
  );
  check(
    past.status === 422 && errorCode(past.json) === 'window_in_past',
    'a window in the past is 422',
  );
  const long = await call(
    'POST',
    '/alerts',
    { ...alertBody, windowEnd: inMinutes(60 * 8) },
    OPERATOR,
  );
  check(
    long.status === 422 && errorCode(long.json) === 'window_too_long',
    'a window over the limit is 422',
  );
  const unknown = await call(
    'POST',
    '/alerts',
    { ...alertBody, targetBarangayIds: ['00000000-0000-4000-8000-000000000000'] },
    OPERATOR,
  );
  check(
    unknown.status === 422 && errorCode(unknown.json) === 'unknown_barangay',
    'unknown target barangay is 422',
  );

  // Push went to Expo after the response. The test token is fake, so Expo should report it as
  // not registered and the API should clear it. Soft check: Expo's answer is outside our control.
  let cleared = false;
  for (let i = 0; i < 15 && !cleared; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const [row] = await db`select push_token from households where id = ${ctx.pushHouseholdId}`;
    cleared = row?.push_token === null;
  }
  if (cleared) check(true, 'push dispatched; Expo rejected the fake token and it was cleared');
  else
    console.log(
      '  note push token not cleared within 15 s (check the Worker log for push_dispatched)',
    );
}

async function cleanup() {
  const alerts = await db`delete from alerts where message like ${`${RUN}%`} returning id`;
  console.log(`cleanup: removed ${alerts.length} test alert(s)`);
  const removed =
    await db`delete from households where meter_serial like ${`${RUN}%`} and not is_simulated returning id`;
  console.log(`cleanup: removed ${removed.length} test household(s)`);
}

try {
  const ctx = await phase1Households();
  await phase2Alerts(ctx);
  console.log(`\nall ${passed} checks passed`);
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
} finally {
  await cleanup();
}
