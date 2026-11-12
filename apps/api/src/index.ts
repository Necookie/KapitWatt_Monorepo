import { createDb, dbHealth } from '@kapitwatt/db';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { cors } from 'hono/cors';
import { requestId } from 'hono/request-id';
import { secureHeaders } from 'hono/secure-headers';
import type { AppEnv, Bindings } from './env';
import { isStrongKey } from './lib/crypto';
import { AppError, errorResponse, handleError } from './lib/errors';
import { accessLog } from './middleware/log';
import { clientIp, rateLimit } from './middleware/rate-limit';
import { alerts } from './routes/alerts';
import { auth } from './routes/auth';
import { barangays } from './routes/barangays';
import { commitments } from './routes/commitments';
import { readings } from './routes/readings';
import { rewards } from './routes/rewards';
import { sim } from './routes/sim';

/** JSON bodies are small; only the photo upload (POST /readings) gets a larger limit, set on that route. */
const JSON_BODY_LIMIT = 16 * 1024;

const allowedOrigins = (env: Bindings) =>
  (env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

export const app = new Hono<AppEnv>();

app.use('*', requestId());
app.use('*', accessLog);
app.use('*', secureHeaders({ xFrameOptions: 'DENY' }));
app.use('*', async (c, next) => {
  await next();
  // API responses carry personal data and live numbers; nothing should be cached.
  c.header('Cache-Control', 'no-store');
});
app.use(
  '*',
  cors({
    // Browsers only: the dashboard. Native apps send no Origin header and are unaffected.
    origin: (origin, c) => (allowedOrigins(c.env).includes(origin) ? origin : null),
    allowMethods: ['GET', 'POST', 'PUT', 'OPTIONS'],
    allowHeaders: [
      'authorization',
      'content-type',
      'idempotency-key',
      'x-operator-key',
      'x-sim-key',
    ],
    exposeHeaders: ['X-Request-Id', 'Retry-After'],
    maxAge: 600,
  }),
);
app.use('*', async (c, next) => {
  if (c.req.method === 'POST' && c.req.path === '/readings') return next();
  return bodyLimit({
    maxSize: JSON_BODY_LIMIT,
    onError: () => {
      throw new AppError(413, 'payload_too_large', 'Request body is too large.');
    },
  })(c, next);
});
// Polling endpoints: generous, because every phone on the demo hotspot shares one IP.
app.use('*', async (c, next) => {
  if (c.req.method !== 'GET') return next();
  return rateLimit('RL_PUBLIC', (ctx) => `get:${clientIp(ctx)}`)(c, next);
});

// Liveness only: does not touch the database. Reports missing configuration by name, never by value.
app.get('/health', (c) => {
  const problems = [
    !c.env.DATABASE_URL && 'DATABASE_URL',
    !isStrongKey(c.env.OPERATOR_KEY) && 'OPERATOR_KEY',
    c.env.APP_ENV === 'demo' && !isStrongKey(c.env.SIM_KEY) && 'SIM_KEY',
  ].filter(Boolean);
  return c.json({
    ok: problems.length === 0,
    env: c.env.APP_ENV,
    config: problems.length === 0 ? 'ok' : 'misconfigured',
    ...(problems.length ? { missing: problems } : {}),
  });
});

app.use('*', async (c, next) => {
  c.set('db', createDb(c.env.DATABASE_URL));
  await next();
});

// Readiness: proves the Worker can reach Neon and shows which migrations are applied.
app.get('/health/db', async (c) => c.json({ ok: true, ...(await dbHealth(c.var.db)) }));

app.route('/auth', auth);
app.route('/barangays', barangays);
app.route('/alerts', alerts);
app.route('/commitments', commitments);
app.route('/readings', readings);
app.route('/rewards', rewards);
app.route('/sim', sim);

app.notFound((c) => errorResponse(c, 404, 'not_found', 'Route not found.'));
app.onError(handleError);

export default {
  fetch: app.fetch,
} satisfies ExportedHandler<Bindings>;
