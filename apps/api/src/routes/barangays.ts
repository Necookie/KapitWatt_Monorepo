import { listBarangaysWithCounts } from '@kapitwatt/db';
import type { BarangayWithCount, LeaderboardResponse } from '@kapitwatt/shared';
import { Hono } from 'hono';
import type { AppEnv } from '../env';
import { leaderboard } from '../services/rewards';

export const barangays = new Hono<AppEnv>();

// Towns and barangays for the sign-up picker and the alert form. Public.
barangays.get('/', async (c) => {
  const body: { barangays: BarangayWithCount[] } = {
    barangays: await listBarangaysWithCounts(c.var.db),
  };
  return c.json(body);
});

// Barangay ranking by verified kWh.
barangays.get('/leaderboard', async (c) => {
  const body: LeaderboardResponse = { leaderboard: await leaderboard(c.var.db) };
  return c.json(body);
});
