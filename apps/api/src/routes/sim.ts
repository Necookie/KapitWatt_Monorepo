import { validate } from '../lib/validate';
import { SimParams, SimRunInput } from '@kapitwatt/shared';
import { Hono } from 'hono';
import type { AppEnv } from '../env';
import { notImplemented } from '../lib/todo';
import { simAuth } from '../middleware/auth';

/**
 * Simulator routes. Demo only: off unless APP_ENV is "demo", and the simulator
 * key is always required. The simulator goes through the same service functions
 * as real households and only ever touches rows flagged is_simulated.
 */
export const sim = new Hono<AppEnv>();

sim.use('*', simAuth);

// Create the Laguna towns, barangays, ~1,200 households and appliances.
sim.post(
  '/seed',
  validate('json', SimParams.pick({ amiShare: true, seed: true }).prefault({})),
  (c) => notImplemented(c, 'sim seed'),
);

// Run an event for an alert: paced commits, then simulated readings.
sim.post('/run', validate('json', SimRunInput), (c) => notImplemented(c, 'sim run'));

// Delete simulated data only.
sim.post('/reset', (c) => notImplemented(c, 'sim reset'));

// Counts, last run and current settings.
sim.get('/status', (c) => notImplemented(c, 'sim status'));
