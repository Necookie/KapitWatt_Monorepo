import type { Context } from 'hono';
import { createMiddleware } from 'hono/factory';
import { matchedRoutes } from 'hono/route';
import type { AppEnv } from '../env';
import { logInfo } from '../lib/log';

/**
 * One access-log line per request: route pattern (not the raw URL, which can carry ids), status, time
 * and actor type. No headers, bodies or query strings.
 */
/** The route pattern that handled the request: the last match registered for a method (app.use is 'ALL'). */
function routeOf(c: Context<AppEnv>): string {
  const handlers = matchedRoutes(c).filter((r) => r.method !== 'ALL');
  return handlers.at(-1)?.path ?? '(unmatched)';
}

export const accessLog = createMiddleware<AppEnv>(async (c, next) => {
  const started = Date.now();
  c.set('actor', 'anonymous');
  await next();
  logInfo('request', {
    requestId: c.get('requestId'),
    method: c.req.method,
    route: routeOf(c),
    status: c.res.status,
    ms: Date.now() - started,
    actor: c.get('actor'),
  });
});
