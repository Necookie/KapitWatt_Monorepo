import { findHouseholdByTokenHash } from '@kapitwatt/db';
import type { Context } from 'hono';
import { createMiddleware } from 'hono/factory';
import type { AppEnv } from '../env';
import { HOUSEHOLD_TOKEN_PATTERN, isStrongKey, safeEqual, sha256Hex } from '../lib/crypto';
import { AppError, notFound, unauthorized } from '../lib/errors';

const misconfigured = () =>
  new AppError(503, 'misconfigured', 'This service is not configured. Ask the API owner.');

/** Bearer token from the Authorization header, or null. */
function bearer(c: Context<AppEnv>): string | null {
  const header = c.req.header('authorization');
  if (!header) return null;
  const match = /^Bearer (\S+)$/i.exec(header);
  return match ? match[1]! : null;
}

/**
 * Household auth. The token was issued once by POST /auth/register; only its SHA-256 hash is stored,
 * so the lookup is by hash equality. Unknown and malformed tokens get the same 401.
 */
export const householdAuth = createMiddleware<AppEnv>(async (c, next) => {
  await authenticateHousehold(c, bearer(c));
  await next();
});

/**
 * For routes anyone may call but households see personalised (GET /alerts/active). No header: the
 * caller is anonymous. A header that is present must be valid; a bad token is a 401, never silently
 * ignored.
 */
export const optionalHouseholdAuth = createMiddleware<AppEnv>(async (c, next) => {
  if (c.req.header('authorization') !== undefined) await authenticateHousehold(c, bearer(c));
  await next();
});

async function authenticateHousehold(c: Context<AppEnv>, token: string | null): Promise<void> {
  if (!token || !HOUSEHOLD_TOKEN_PATTERN.test(token)) throw unauthorized();
  const household = await findHouseholdByTokenHash(c.var.db, await sha256Hex(token));
  if (!household) throw unauthorized();
  c.set('householdId', household.id);
  c.set('actor', 'household');
}

/** True when the request carries the right operator key. For routes that only change what they show. */
export async function hasOperatorKey(c: Context<AppEnv>): Promise<boolean> {
  const given = c.req.header('x-operator-key');
  if (!given || !isStrongKey(c.env.OPERATOR_KEY)) return false;
  return safeEqual(given, c.env.OPERATOR_KEY);
}

/**
 * Operator (dashboard) auth: one shared key for the demo, compared in constant time. A weak or missing
 * key on the server turns these routes off rather than leaving them guessable.
 */
export const operatorAuth = createMiddleware<AppEnv>(async (c, next) => {
  if (!isStrongKey(c.env.OPERATOR_KEY)) throw misconfigured();
  const given = c.req.header('x-operator-key') ?? '';
  if (!(await safeEqual(given, c.env.OPERATOR_KEY))) throw unauthorized();
  c.set('actor', 'operator');
  await next();
});

/**
 * Simulator safety: the routes do not exist outside the demo environment, and always need the
 * simulator key.
 */
export const simAuth = createMiddleware<AppEnv>(async (c, next) => {
  if (c.env.APP_ENV !== 'demo') throw notFound('Route');
  if (!isStrongKey(c.env.SIM_KEY)) throw misconfigured();
  const given = c.req.header('x-sim-key') ?? '';
  if (!(await safeEqual(given, c.env.SIM_KEY))) throw unauthorized();
  c.set('actor', 'sim');
  await next();
});

/** Demo-only operator tools (Measure / fast-forward). */
export const demoOnly = createMiddleware<AppEnv>(async (c, next) => {
  if (c.env.APP_ENV !== 'demo') throw notFound('Route');
  await next();
});
