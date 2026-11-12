import {
  DeleteAccountInput,
  LoginInput,
  RegisterHouseholdInput,
  UpdateProfileInput,
  UpdatePushTokenInput,
} from '@kapitwatt/shared';
import { Hono } from 'hono';
import type { AppEnv } from '../env';
import { validate } from '../lib/validate';
import { householdAuth } from '../middleware/auth';
import { clientIp, rateLimit } from '../middleware/rate-limit';
import * as households from '../services/households';

/** Sign-up and opt-in. P0. */
export const auth = new Hono<AppEnv>();

const perHousehold = rateLimit('RL_HOUSEHOLD', (c) => `hh:${c.var.householdId}`);

// Opt in, register meter type and serial, store consent. Returns the token once, plus the household.
auth.post(
  '/register',
  rateLimit('RL_REGISTER', (c) => `register:${clientIp(c)}`),
  validate('json', RegisterHouseholdInput),
  async (c) => c.json(await households.register(c.var.db, c.req.valid('json')), 201),
);

// Log in with email and password. Rate-limited per IP, which also slows password guessing.
auth.post(
  '/login',
  rateLimit('RL_REGISTER', (c) => `login:${clientIp(c)}`),
  validate('json', LoginInput),
  async (c) => c.json(await households.login(c.var.db, c.req.valid('json'))),
);

// Log out: the token stops working.
auth.post('/logout', householdAuth, async (c) => {
  await households.logout(c.var.db, c.var.householdId);
  return c.body(null, 204);
});

// Store or refresh the Expo push token.
auth.put(
  '/push-token',
  householdAuth,
  perHousehold,
  validate('json', UpdatePushTokenInput),
  async (c) => {
    await households.setPushToken(c.var.db, c.var.householdId, c.req.valid('json').pushToken);
    return c.body(null, 204);
  },
);

// Current household: baseline, rehearsal progress, trust score, commit cap, points.
auth.get('/me', householdAuth, async (c) =>
  c.json(await households.me(c.var.db, c.var.householdId)),
);

// Correct the account holder name or service address, or turn grid alerts off and on.
auth.patch('/me', householdAuth, perHousehold, validate('json', UpdateProfileInput), async (c) =>
  c.json(await households.updateProfile(c.var.db, c.var.householdId, c.req.valid('json'))),
);

// Withdraw consent and erase the household, its readings and its meter photos.
auth.delete('/me', householdAuth, perHousehold, validate('json', DeleteAccountInput), async (c) => {
  await households.deleteAccount(
    c.var.db,
    c.env.PHOTOS,
    c.var.householdId,
    c.req.valid('json').password,
  );
  return c.body(null, 204);
});
