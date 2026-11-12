/**
 * Rebuilds the whole demo world from scratch. Demo only; it deletes data.
 *
 *   pnpm demo:reset -- --yes
 *
 *   1. The 21 pilot barangays (idempotent), then the ten demo accounts: created if missing, marked
 *      demo, moved to Bagumbayan, baselines set. First, so a failure here deletes nothing.
 *   2. Clean slate: every alert (and its commitments, readings, rewards), every simulated household,
 *      orphan sign-ups (no email and no login token), the demo accounts' leftover readings.
 *   3. About 1,200 simulated households (seed 2026).
 *   4. Six past events over four weeks, each through the real services (alert, commits, readings,
 *      settlement) with no push, then moved back to its date (apps/api/src/services/demo.ts).
 *   5. A forecast of the live event with LIVE_EVENT.seed (scripts/demo/live.ts).
 *
 * Real households with a login keep their accounts; their event history goes with the alerts.
 * Run it before the phones are handed out: for a few seconds per event a replayed alert is open.
 *
 * Environment (from Doppler): DATABASE_URL; API_URL only to register a missing demo account.
 * Optional: DEMO_PASSWORD, DEMO_LAT, DEMO_LNG (see scripts/demo-accounts.ts).
 */
import {
  createDb,
  listBarangays,
  listDemoHouseholds,
  seedPilotBarangays,
  wipeDemoWorld,
} from '@kapitwatt/db';
import { PAST_EVENTS, replayPastEvent } from '../src/services/demo';
import { seedSimulation } from '../src/services/sim';
import { DEFAULT_DEMO_PASSWORD, DEMO_VENUE, ensureDemoAccounts } from './demo/accounts';
import { describeForecast, forecastWithSeed, LIVE_EVENT, loadForecastInputs } from './demo/live';

/** The simulated households' seed. Kept apart from the live event's seed, which is searched for. */
const HOUSEHOLD_SEED = 2026;

const url = process.env.DATABASE_URL ?? '';
const host = url.match(/@([^/?]+)/)?.[1] ?? '(unknown host)';
if (!process.argv.includes('--yes')) {
  console.log(`This deletes every alert and all simulated data on ${host}.`);
  console.log('Run again with --yes to go ahead:  pnpm demo:reset -- --yes');
  process.exit(1);
}
const db = createDb(url);
const t0 = Date.now();
const elapsed = () => `${Math.round((Date.now() - t0) / 1000)} s`;

console.log(`demo reset on ${host}\n`);
// The accounts come first: registering a missing one goes through API_URL, and if that API writes to
// another database the lookup below fails here, before anything has been deleted.
await seedPilotBarangays(db);
console.log('1. demo accounts');
await ensureDemoAccounts({
  api: process.env.API_URL ?? 'https://kapitwatt-api.dheyn-main.workers.dev',
  db,
  password: process.env.DEMO_PASSWORD ?? DEFAULT_DEMO_PASSWORD,
  lat: Number(process.env.DEMO_LAT ?? DEMO_VENUE.lat),
  lng: Number(process.env.DEMO_LNG ?? DEMO_VENUE.lng),
});

const wiped = await wipeDemoWorld(db);
console.log(
  `2. clean slate: ${wiped.alerts} alerts, ${wiped.simulated} simulated and ${wiped.orphans} orphan households deleted`,
);

const status = await seedSimulation(db, { amiShare: 0.15, seed: HOUSEHOLD_SEED });
console.log(
  `3. seeded ${status.simulatedHouseholds} simulated households (${status.amiHouseholds} smart meter, ${status.photoHouseholds} photo)`,
);

console.log('4. past events');
const barangays = await listBarangays(db);
let previousDaysAgo: number | null = null;
for (const event of PAST_EVENTS) {
  const r = await replayPastEvent(db, event, { now: new Date(), barangays, previousDaysAgo });
  previousDaysAgo = event.daysAgo;
  const s = r.settlement;
  console.log(
    `  ${r.windowStart.toISOString().slice(0, 16)}Z ${event.level.padEnd(6)} target ${String(event.targetKw).padStart(3)} kW: ` +
      `${r.simulatedCommitted} simulated + ${r.demoCommitted} demo committed, ` +
      `${s?.verifiedCount ?? 0} verified, ${s?.deliveredKw ?? 0} kW delivered  (${elapsed()})`,
  );
}

console.log('\nDemo accounts after the replay (a typed reading must be higher than the last one):');
for (const h of await listDemoHouseholds(db)) {
  const last =
    h.lastReadingKwh === null ? 'no reading yet' : `last reading ${h.lastReadingKwh} kWh`;
  const meter = h.meterType === 'ami' ? 'smart meter' : 'photo';
  console.log(
    `  ${h.email.padEnd(24)} ${meter.padEnd(11)} trust ${String(h.trustScore).padStart(3)}  ${last}`,
  );
}

console.log(
  `\n5. live event forecast: alert ${LIVE_EVENT.targetKw} kW to all pilot areas, simulator seed ${LIVE_EVENT.seed}`,
);
const inputs = await loadForecastInputs(db);
for (const line of describeForecast(inputs, await forecastWithSeed(inputs, LIVE_EVENT.seed))) {
  console.log(`  ${line}`);
}
console.log(`\ndone in ${elapsed()}`);
