import { createMiddleware } from 'hono/factory';
import type { AppEnv } from '../env';

/**
 * Household auth: simple bearer token for the demo, issued by POST /auth/register.
 * TODO(api owner): look the token up in households.auth_token_hash and set householdId.
 */
export const householdAuth = createMiddleware<AppEnv>(async (c, _next) => {
  const token = c.req.header('authorization')?.replace(/^Bearer /i, '');
  if (!token) return c.json({ error: 'unauthorized' }, 401);
  // Once the lookup exists: c.set('householdId', household.id); await _next();
  return c.json({ error: 'not_implemented', what: 'household token lookup' }, 501);
});

/** Operator (dashboard) auth: one shared key for the demo. */
export const operatorAuth = createMiddleware<AppEnv>(async (c, next) => {
  if (!c.env.OPERATOR_KEY || c.req.header('x-operator-key') !== c.env.OPERATOR_KEY) {
    return c.json({ error: 'unauthorized' }, 401);
  }
  await next();
});

/**
 * Simulator safety: routes are off outside the demo environment and always
 * require the simulator key.
 */
export const simAuth = createMiddleware<AppEnv>(async (c, next) => {
  if (c.env.APP_ENV !== 'demo') return c.notFound();
  if (!c.env.SIM_KEY || c.req.header('x-sim-key') !== c.env.SIM_KEY) {
    return c.json({ error: 'unauthorized' }, 401);
  }
  await next();
});
