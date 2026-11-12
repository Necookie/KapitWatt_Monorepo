import { Hono } from 'hono';
import type { AppEnv } from '../env';
import { notImplemented } from '../lib/todo';

export const barangays = new Hono<AppEnv>();

// Towns and barangays for the sign-up picker and the alert form. Public.
barangays.get('/', (c) => notImplemented(c, 'list barangays'));

// Barangay ranking by verified kWh.
barangays.get('/leaderboard', (c) => notImplemented(c, 'barangay leaderboard'));
