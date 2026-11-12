/**
 * Read-only smoke test of a deployed API. Writes nothing.
 *
 *   doppler run -- pnpm --filter @kapitwatt/api smoke:live
 *
 * API_URL defaults to the live Worker. OPERATOR_KEY and SIM_KEY (from Doppler) unlock the operator
 * and simulator checks; without them those checks are skipped, not failed.
 */
import {
  ActiveAlertResponse,
  AlertLogResponse,
  ApiErrorBody,
  FlaggedReadingsResponse,
  LeaderboardResponse,
  SimStatus,
} from '@kapitwatt/shared';

const API = process.env.API_URL ?? 'https://kapitwatt-api.dheyn-main.workers.dev';
const OPERATOR_KEY = process.env.OPERATOR_KEY ?? '';
const SIM_KEY = process.env.SIM_KEY ?? '';
const EXPECTED_MIGRATIONS = ['0001_init.sql', '0002_api.sql', '0003_reminders.sql'];

let failed = 0;
let passed = 0;
function check(cond: unknown, what: string) {
  if (cond) {
    passed++;
    console.log(`  ok    ${what}`);
  } else {
    failed++;
    console.log(`  FAIL  ${what}`);
  }
}
const skip = (what: string) => console.log(`  skip  ${what}`);

async function get(path: string, headers: Record<string, string> = {}) {
  const res = await fetch(`${API}${path}`, { headers });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { res, json };
}

console.log(`smoke: ${API}`);

const health = await get('/health');
const h = health.json as { ok?: boolean; env?: string; config?: string; missing?: string[] };
check(health.res.status === 200 && h.ok === true, 'GET /health is ok');
check(
  h.config === 'ok',
  `configuration complete${h.missing ? ` (missing: ${h.missing.join(', ')})` : ''}`,
);
check(h.env === 'demo', `APP_ENV is demo (got ${h.env})`);
check(health.res.headers.get('x-content-type-options') === 'nosniff', 'nosniff header');
check(health.res.headers.get('x-frame-options') === 'DENY', 'X-Frame-Options: DENY');
check(health.res.headers.get('cache-control') === 'no-store', 'Cache-Control: no-store');
check(health.res.headers.get('x-request-id'), 'X-Request-Id echoed');

const db = await get('/health/db');
const migrations = (db.json as { migrations?: string[] }).migrations ?? [];
check(
  EXPECTED_MIGRATIONS.every((m) => migrations.includes(m)),
  `migrations applied (${migrations.join(', ')})`,
);

const barangays = await get('/barangays');
const list = (barangays.json as { barangays?: { optedInHouseholds?: number }[] }).barangays ?? [];
check(
  list.length === 21 && list.every((b) => typeof b.optedInHouseholds === 'number'),
  'GET /barangays: 21 with counts',
);

const active = await get('/alerts/active');
check(
  active.res.status === 200 && ActiveAlertResponse.safeParse(active.json).success,
  'GET /alerts/active',
);
const board = await get('/barangays/leaderboard');
check(
  board.res.status === 200 && LeaderboardResponse.safeParse(board.json).success,
  'GET /barangays/leaderboard',
);

const missing = await get('/nope');
check(
  missing.res.status === 404 && ApiErrorBody.safeParse(missing.json).success,
  'unknown route: 404 envelope',
);
const me = await get('/auth/me');
check(me.res.status === 401, 'household route without a token: 401');
const cors = await fetch(`${API}/alerts`, {
  method: 'OPTIONS',
  headers: { origin: 'https://evil.example', 'access-control-request-method': 'POST' },
});
check(cors.headers.get('access-control-allow-origin') === null, 'CORS refuses unknown origins');

const wrongOp = await get('/alerts', { 'x-operator-key': 'x'.repeat(40) });
check(wrongOp.res.status === 401, 'wrong operator key: 401');
if (OPERATOR_KEY) {
  const log = await get('/alerts?limit=5', { 'x-operator-key': OPERATOR_KEY });
  check(
    log.res.status === 200 && AlertLogResponse.safeParse(log.json).success,
    'operator: GET /alerts',
  );
  const flagged = await get('/readings/flagged', { 'x-operator-key': OPERATOR_KEY });
  check(
    flagged.res.status === 200 && FlaggedReadingsResponse.safeParse(flagged.json).success,
    'operator: GET /readings/flagged',
  );
} else {
  skip('operator checks (OPERATOR_KEY not set)');
}
if (SIM_KEY) {
  const sim = await get('/sim/status', { 'x-sim-key': SIM_KEY });
  check(
    sim.res.status === 200 && SimStatus.safeParse(sim.json).success,
    'simulator: GET /sim/status',
  );
} else {
  skip('simulator checks (SIM_KEY not set)');
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exitCode = failed ? 1 : 0;
