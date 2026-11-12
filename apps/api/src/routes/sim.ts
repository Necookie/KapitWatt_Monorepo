import { SimParams, SimRunInput } from '@kapitwatt/shared';
import { Hono } from 'hono';
import type { AppEnv } from '../env';
import { validate } from '../lib/validate';
import { simAuth } from '../middleware/auth';
import { rateLimit } from '../middleware/rate-limit';
import * as simService from '../services/sim';

/**
 * Simulator routes. Demo only: they do not exist unless APP_ENV is "demo", and the simulator key is
 * always required. The simulator goes through the same service functions as real households and
 * only ever touches rows flagged is_simulated.
 */
export const sim = new Hono<AppEnv>();

sim.use(
  '*',
  simAuth,
  rateLimit('RL_OPERATOR', () => 'sim'),
);

// About 1,200 simulated households across the 21 pilot barangays. 409 already_seeded: reset first.
sim.post(
  '/seed',
  validate('json', SimParams.pick({ amiShare: true, seed: true }).prefault({})),
  async (c) => c.json(await simService.seedSimulation(c.var.db, c.req.valid('json')), 201),
);

// One phase of an event for an alert: `commit` (paced, before window start) or `deliver`
// (meter readings, after window end). The commit phase holds the request for about paceSeconds.
sim.post('/run', validate('json', SimRunInput), async (c) =>
  c.json(await simService.runSimulation(c.var.db, c.req.valid('json'), c.env.APP_ENV === 'demo')),
);

// Delete simulated data only. Real households and alerts stay.
sim.post('/reset', async (c) => c.json(await simService.resetSimulation(c.var.db)));

// Counts and default parameters.
sim.get('/status', async (c) => c.json(await simService.simStatus(c.var.db)));
