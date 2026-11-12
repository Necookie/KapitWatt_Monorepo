import { createDb, dbHealth } from '@kapitwatt/db';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { AppEnv } from './env';
import { alerts } from './routes/alerts';
import { auth } from './routes/auth';
import { barangays } from './routes/barangays';
import { commitments } from './routes/commitments';
import { readings } from './routes/readings';
import { rewards } from './routes/rewards';
import { sim } from './routes/sim';

const app = new Hono<AppEnv>();

app.use('*', cors());

// Liveness only: does not touch the database.
app.get('/health', (c) => c.json({ ok: true, env: c.env.APP_ENV }));

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

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: 'internal_error' }, 500);
});

export default app;
