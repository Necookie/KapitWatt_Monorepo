export interface Bindings {
  APP_ENV: string;
  DATABASE_URL: string;
  /** Required on every /sim/* request (x-sim-key header). */
  SIM_KEY: string;
  /** Simple shared key for the operator dashboard in the demo (x-operator-key header). */
  OPERATOR_KEY: string;
}

export interface Variables {
  /** Set by householdAuth once the bearer token is resolved. */
  householdId: string;
}

export type AppEnv = { Bindings: Bindings; Variables: Variables };
