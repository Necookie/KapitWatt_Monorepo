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
 *   DEMO_LAT, DEMO_LNG   where the demo is held. Meter photos are checked against this location
 *                        (within GPS_MAX_DISTANCE_M), so set it to the venue before creating them.
 */
import { createDb } from '@kapitwatt/db';
import { DEFAULT_DEMO_PASSWORD, ensureDemoAccounts, removeDemoAccounts } from './demo/accounts';

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
    // Default: Santa Cruz town proper.
    lat: Number(process.env.DEMO_LAT ?? 14.2814),
    lng: Number(process.env.DEMO_LNG ?? 121.4161),
  });
  console.log('\nOne phone per account: logging in on a second phone signs the first one out.');
}
