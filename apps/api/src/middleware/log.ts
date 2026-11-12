import { createMiddleware } from 'hono/factory';
import { routePath } from 'hono/route';
import type { AppEnv } from '../env';
import { logInfo } from '../lib/log';

/**
 * One access-log line per request: route pattern (not the raw URL, which can carry ids), status, time
 * and actor type. No headers, bodies or query strings.
 */
export const accessLog = createMiddleware<AppEnv>(async (c, next) => {
  const started = Date.now();
  c.set('actor', 'anonymous');
  await next();
  logInfo('request', {
    requestId: c.get('requestId'),
    method: c.req.method,
    route: routePath(c, -1),
    status: c.res.status,
    ms: Date.now() - started,
    actor: c.get('actor'),
  });
});
