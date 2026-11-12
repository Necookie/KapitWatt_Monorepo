/**
 * @kapitwatt/db: Postgres schema, migrations and query helpers.
 *
 * Only this package and apps/api may touch Postgres. The Neon-or-Supabase choice
 * is still open, so no driver is installed yet. Whoever owns this package:
 *
 *   1. Pick the provider and add its driver here (and nowhere else).
 *   2. Implement `createDb` below.
 *   3. Add query helpers under src/queries/, one file per table, returning the
 *      entity types from @kapitwatt/shared.
 *
 * Schema: ../migrations/0001_init.sql
 */

export interface Db {
  /** Tagged-template or parameterised query; shape depends on the driver chosen. */
  query<T = unknown>(sql: string, params?: readonly unknown[]): Promise<T[]>;
}

export function createDb(_databaseUrl: string): Db {
  throw new Error(
    '@kapitwatt/db: no Postgres driver chosen yet (Neon or Supabase). See src/index.ts.',
  );
}
