import { zValidator } from '@hono/zod-validator';
import { RegisterHouseholdInput } from '@kapitwatt/shared';
import { Hono } from 'hono';
import { z } from 'zod';
import type { AppEnv } from '../env';
import { notImplemented } from '../lib/todo';
import { householdAuth } from '../middleware/auth';

/** Sign-up and opt-in. P0. */
export const auth = new Hono<AppEnv>();

// Opt in, register meter type and serial, store consent. Returns the household and its token.
auth.post('/register', zValidator('json', RegisterHouseholdInput), (c) =>
  notImplemented(c, 'register household'),
);

// Store or refresh the Expo push token.
auth.put(
  '/push-token',
  householdAuth,
  zValidator('json', z.object({ pushToken: z.string() })),
  (c) => notImplemented(c, 'store push token'),
);

// Current household: baseline, trust score, commit cap, points.
auth.get('/me', householdAuth, (c) => notImplemented(c, 'get current household'));
