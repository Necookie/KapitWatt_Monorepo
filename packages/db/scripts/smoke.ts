/**
 * End-to-end check of the app's database path: the same serverless driver and
 * query helpers the API uses, over the pooled DATABASE_URL.
 * Writes one barangay, reads it back, deletes it. Run: `pnpm db:smoke`.
 */
import { createDb, dbHealth, deleteBarangay, insertBarangay, listBarangays } from '../src/index';

const db = createDb(process.env.DATABASE_URL ?? '');

const health = await dbHealth(db);
console.log(
  'connected:',
  health.database,
  '| migrations:',
  health.migrations.join(', ') || '(none)',
);

const name = `__smoke_${Date.now()}`;
const created = await insertBarangay(db, { name, municipality: '__smoke__' });
const found = (await listBarangays(db)).some((b) => b.id === created.id && b.name === name);
await deleteBarangay(db, created.id);
const gone = !(await listBarangays(db)).some((b) => b.id === created.id);

console.log(`insert: ok (${created.id})`);
console.log(`read back: ${found ? 'ok' : 'FAILED'}`);
console.log(`delete: ${gone ? 'ok' : 'FAILED'}`);
if (!found || !gone) process.exit(1);
