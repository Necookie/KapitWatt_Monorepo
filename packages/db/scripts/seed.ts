/**
 * Loads reference data every environment needs: the 21 pilot barangays.
 * Safe to re-run. Simulated households are NOT seeded here; those go through
 * POST /sim/seed so they use the real registration code path.
 * Run: `pnpm db:seed`.
 */
import { createDb, listBarangays, seedPilotBarangays } from '../src/index';

const db = createDb(process.env.DATABASE_URL ?? '');

const inserted = await seedPilotBarangays(db);
const all = await listBarangays(db);
const towns = new Set(all.map((b) => b.municipality));

console.log(`barangays inserted: ${inserted}`);
console.log(`barangays in database: ${all.length} across ${towns.size} towns`);
