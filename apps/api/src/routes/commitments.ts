import { CreateCommitmentInput, type HistoryResponse } from '@kapitwatt/shared';
import type { Context } from 'hono';
import { Hono } from 'hono';
import type { AppEnv } from '../env';
import { AlertIdParam, LimitQuery } from '../lib/params';
import { validate } from '../lib/validate';
import { householdAuth } from '../middleware/auth';
import { rateLimit } from '../middleware/rate-limit';
import * as commit from '../services/commit';

/** Household-only. Every query is scoped to the authenticated household; no id comes from the client. */
export const commitments = new Hono<AppEnv>();

const isDemo = (c: Context<AppEnv>) => c.env.APP_ENV === 'demo';

commitments.use('*', householdAuth);

// Commit a cut in kW. Capped by baseline and bill (trust score in P1); closes at window start;
// one per household per alert; the path comes from the meter type.
commitments.post(
  '/',
  rateLimit('RL_HOUSEHOLD', (c) => `hh:${c.var.householdId}`),
  validate('json', CreateCommitmentInput),
  async (c) =>
    c.json(
      await commit.createCommitment(c.var.db, c.var.householdId, c.req.valid('json'), isDemo(c)),
      201,
    ),
);

// This household's commitment for an alert, with photo deadlines and barangay progress.
// 404 not_committed before the household commits.
commitments.get('/by-alert/:alertId', validate('param', AlertIdParam), async (c) =>
  c.json(
    await commit.getCommitmentView(
      c.var.db,
      c.var.householdId,
      c.req.valid('param').alertId,
      isDemo(c),
    ),
  ),
);

// Past and current events, newest first.
commitments.get('/history', validate('query', LimitQuery), async (c) => {
  const body: HistoryResponse = {
    history: await commit.history(c.var.db, c.var.householdId, c.req.valid('query').limit),
  };
  return c.json(body);
});
