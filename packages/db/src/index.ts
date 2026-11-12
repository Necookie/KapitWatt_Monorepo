/**
 * @kapitwatt/db: Postgres (Neon) schema, migrations and query helpers.
 *
 * Only this package and apps/api may touch Postgres, and this is the only place
 * a database driver is imported.
 *
 * Driver: @neondatabase/serverless over HTTP, which is what Neon recommends for
 * Cloudflare Workers without Hyperdrive. Each query is one HTTPS request, so
 * there is no connection to open, pool or close inside a Worker request.
 *   - App traffic uses the pooled DATABASE_URL.
 *   - Migrations use the direct DATABASE_URL_UNPOOLED (see scripts/migrate.ts).
 *   - Multi-statement atomic writes (settlement): db.transaction([...]).
 * If the team later adds Cloudflare Hyperdrive, swap this file to `pg` and
 * nothing outside this package changes.
 */
import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

export type Db = NeonQueryFunction<false, false>;

export function createDb(databaseUrl: string): Db {
  if (!databaseUrl) throw new Error('@kapitwatt/db: DATABASE_URL is not set');
  return neon(databaseUrl);
}

export * from './queries/health';
export * from './queries/barangays';
export * from './queries/households';
export * from './queries/alerts';
export * from './queries/commitments';
