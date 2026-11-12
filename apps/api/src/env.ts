import type { Db } from '@kapitwatt/db';

export interface Bindings {
  APP_ENV: string;
  /** Neon pooled connection string (hostname contains -pooler). */
  DATABASE_URL: string;
  /** Required on every /sim/* request (x-sim-key header). */
  SIM_KEY: string;
  /** Simple shared key for the operator dashboard in the demo (x-operator-key header). */
  OPERATOR_KEY: string;
}

export interface Variables {
  /** Per-request database handle. Use c.var.db in routes and pass it to services. */
  db: Db;
  /** Set by householdAuth once the bearer token is resolved. */
  householdId: string;
}

export type AppEnv = { Bindings: Bindings; Variables: Variables };
