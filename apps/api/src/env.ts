import type { Db } from '@kapitwatt/db';
import type { RequestIdVariables } from 'hono/request-id';

export interface Bindings {
  /** "demo" turns on the /sim routes and Measure (fast-forward). */
  APP_ENV: string;
  /** Comma-separated browser origins allowed by CORS (the dashboard). Native apps send no Origin. */
  ALLOWED_ORIGINS?: string;
  /** Neon pooled connection string (hostname contains -pooler). Secret, from Doppler. */
  DATABASE_URL: string;
  /** Required on every /sim/* request (x-sim-key header). Secret, at least 32 characters. */
  SIM_KEY: string;
  /** Shared operator key for the dashboard in the demo (x-operator-key header). Secret, 32+ characters. */
  OPERATOR_KEY: string;
  /** Optional Expo access token for push. */
  EXPO_ACCESS_TOKEN?: string;
  /** Private bucket for meter photos. */
  PHOTOS?: R2Bucket;
  /** Workers Rate Limiting bindings. Missing bindings (unit tests) skip the check. */
  RL_REGISTER?: RateLimit;
  RL_HOUSEHOLD?: RateLimit;
  RL_OPERATOR?: RateLimit;
  RL_PUBLIC?: RateLimit;
}

export type Actor = 'anonymous' | 'household' | 'operator' | 'sim';

export interface Variables extends RequestIdVariables {
  /** Per-request database handle. Use c.var.db in routes and pass it to services. */
  db: Db;
  /** Set by householdAuth once the bearer token is resolved. */
  householdId: string;
  /** Who is calling, for the access log. */
  actor: Actor;
}

export type AppEnv = { Bindings: Bindings; Variables: Variables };

export type RateLimitBinding = 'RL_REGISTER' | 'RL_HOUSEHOLD' | 'RL_OPERATOR' | 'RL_PUBLIC';
