import { listBarangaysWithCounts } from '@kapitwatt/db';
import type { BarangayWithCount } from '@kapitwatt/shared';
import { Hono } from 'hono';
import type { AppEnv } from '../env';
import { notImplemented } from '../lib/todo';

export const barangays = new Hono<AppEnv>();

// Towns and barangays for the sign-up picker and the alert form. Public.
barangays.get('/', async (c) => {
  const body: { barangays: BarangayWithCount[] } = {
    barangays: await listBarangaysWithCounts(c.var.db),
  };
  return c.json(body);
});

// Barangay ranking by verified kWh.
barangays.get('/leaderboard', (c) => notImplemented(c, 'barangay leaderboard'));
