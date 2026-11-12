import type { Context } from 'hono';
import { Hono } from 'hono';
import type { AppEnv } from '../env';
import { AlertIdParam } from '../lib/params';
import { validate } from '../lib/validate';
import { householdAuth } from '../middleware/auth';
import * as rewardsService from '../services/rewards';

/** Household-only; every query is scoped to the authenticated household. */
export const rewards = new Hono<AppEnv>();

const isDemo = (c: Context<AppEnv>) => c.env.APP_ENV === 'demo';

rewards.use('*', householdAuth);

// Result card after settlement: verified cut, bill credit, barangay bonus, points, reason if zero.
// 404 not_settled until settlement has run.
rewards.get('/by-alert/:alertId', validate('param', AlertIdParam), async (c) =>
  c.json(
    await rewardsService.resultCard(
      c.var.db,
      c.var.householdId,
      c.req.valid('param').alertId,
      isDemo(c),
    ),
  ),
);

// Running points and credit totals.
rewards.get('/summary', async (c) =>
  c.json(await rewardsService.rewardsSummary(c.var.db, c.var.householdId)),
);
