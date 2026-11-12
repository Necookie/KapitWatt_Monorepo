import type { Db } from '../index';

export interface DbHealth {
  database: string;
  /** Migrations applied, newest last. Empty means `pnpm db:migrate` has not been run. */
  migrations: string[];
}

export async function dbHealth(db: Db): Promise<DbHealth> {
  const [row] = await db`select current_database() as database`;
  const [reg] = await db`select to_regclass('public.schema_migrations') as t`;
  const applied = reg?.t ? await db`select name from schema_migrations order by name` : [];
  return {
    database: String(row?.database),
    migrations: applied.map((m) => String(m.name)),
  };
}
