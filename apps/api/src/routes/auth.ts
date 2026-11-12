import { validate } from '../lib/validate';
import { RegisterHouseholdInput, UpdatePushTokenInput } from '@kapitwatt/shared';
import { Hono } from 'hono';
import type { AppEnv } from '../env';
import { notImplemented } from '../lib/todo';
import { householdAuth } from '../middleware/auth';

/** Sign-up and opt-in. P0. */
export const auth = new Hono<AppEnv>();

// Opt in, register meter type and serial, store consent. Returns the household and its token.
auth.post('/register', validate('json', RegisterHouseholdInput), (c) =>
  notImplemented(c, 'register household'),
);

// Store or refresh the Expo push token.
auth.put('/push-token', householdAuth, validate('json', UpdatePushTokenInput), (c) =>
  notImplemented(c, 'store push token'),
);

// Current household: baseline, trust score, commit cap, points.
auth.get('/me', householdAuth, (c) => notImplemented(c, 'get current household'));
