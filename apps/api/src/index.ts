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

app.get('/health', (c) => c.json({ ok: true, env: c.env.APP_ENV }));

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
