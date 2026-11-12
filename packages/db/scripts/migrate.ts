/**
 * Applies packages/db/migrations/*.sql in filename order, once each.
 * Run from the repo root: `pnpm db:migrate`.
 *
 * Uses the DIRECT connection (DATABASE_URL_UNPOOLED), not the pooled one:
 * migrations need session state that PgBouncer transaction pooling drops.
 * Each file runs in its own transaction and is recorded in schema_migrations.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import pg from 'pg';

const url = process.env.DATABASE_URL_UNPOOLED;
if (!url) {
  console.error('DATABASE_URL_UNPOOLED is not set. Run `neon env pull` in the repo root first.');
  process.exit(1);
}

const dir = join(import.meta.dirname, '..', 'migrations');
const client = new pg.Client({ connectionString: url });
await client.connect();

try {
  await client.query(`
    create table if not exists schema_migrations (
      name        text primary key,
      applied_at  timestamptz not null default now()
    )`);
  const applied = new Set(
    (await client.query<{ name: string }>('select name from schema_migrations')).rows.map(
      (r) => r.name,
    ),
  );
  const files = (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort();

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`skip   ${file} (already applied)`);
      continue;
    }
    const sql = await readFile(join(dir, file), 'utf8');
    await client.query('begin');
    try {
      await client.query(sql);
      await client.query('insert into schema_migrations (name) values ($1)', [file]);
      await client.query('commit');
      console.log(`apply  ${file}`);
    } catch (err) {
      await client.query('rollback');
      throw new Error(`migration ${file} failed and was rolled back`, { cause: err });
    }
  }
  console.log('migrations up to date');
} finally {
  await client.end();
}
