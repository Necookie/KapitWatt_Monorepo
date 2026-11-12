import type { AlertHistoryResponse } from '@kapitwatt/shared';
import type { Context } from 'hono';
import { Hono } from 'hono';
import type { AppEnv } from '../env';
import { IdParam, LimitQuery } from '../lib/params';
import { validate } from '../lib/validate';
import { operatorAuth } from '../middleware/auth';
import { rateLimit } from '../middleware/rate-limit';
import * as analytics from '../services/analytics';

/** Operator analytics: aggregates only, never household rows. */
export const analyticsRoutes = new Hono<AppEnv>();

const isDemo = (c: Context<AppEnv>) => c.env.APP_ENV === 'demo';

analyticsRoutes.use(
  '*',
  operatorAuth,
  rateLimit('RL_OPERATOR', () => 'operator'),
);

// One alert: funnel by path, outcomes, payouts and cost per kWh, barangays at target, commit timeline.
analyticsRoutes.get('/alerts/:id', validate('param', IdParam), async (c) =>
  c.json(await analytics.alertAnalytics(c.var.db, c.req.valid('param').id, isDemo(c))),
);

// Recent alerts with committed, delivered and paid totals, newest first.
analyticsRoutes.get('/history', validate('query', LimitQuery), async (c) => {
  const body: AlertHistoryResponse = {
    alerts: await analytics.alertHistory(c.var.db, c.req.valid('query').limit, isDemo(c)),
  };
  return c.json(body);
});
