/**
 * Creates the ten demo households the team logs into on the phones. Demo only.
 *
 *   pnpm demo:accounts              create the missing ones, mark them demo, put them in Bagumbayan
 *   pnpm demo:accounts -- --remove  delete all ten
 *
 * `pnpm demo:reset` runs the same step as part of the full reset; see scripts/demo/accounts.ts.
 *
 * Environment (from Doppler): API_URL, DATABASE_URL. Optional:
 *   DEMO_PASSWORD        the password of all ten accounts (default in scripts/demo/accounts.ts)
 *   DEMO_LAT, DEMO_LNG   where the demo is held (default DEMO_VENUE: Ortigas, Pasig). Meter photos
 *                        are checked against this location (within GPS_MAX_DISTANCE_M).
 */
import { createDb } from '@kapitwatt/db';
import {
  DEFAULT_DEMO_PASSWORD,
  DEMO_VENUE,
  ensureDemoAccounts,
  removeDemoAccounts,
} from './demo/accounts';

const api = process.env.API_URL ?? 'https://kapitwatt-api.dheyn-main.workers.dev';
const db = createDb(process.env.DATABASE_URL ?? '');
const password = process.env.DEMO_PASSWORD ?? DEFAULT_DEMO_PASSWORD;

if (process.argv.includes('--remove')) {
  console.log(`removed ${await removeDemoAccounts(db)} demo household(s)`);
} else {
  console.log(`demo accounts on ${api}; password: ${password}\n`);
  await ensureDemoAccounts({
    api,
    db,
    password,
    lat: Number(process.env.DEMO_LAT ?? DEMO_VENUE.lat),
    lng: Number(process.env.DEMO_LNG ?? DEMO_VENUE.lng),
  });
  console.log('\nOne phone per account: logging in on a second phone signs the first one out.');
}
