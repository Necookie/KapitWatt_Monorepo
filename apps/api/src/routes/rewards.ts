import { Hono } from 'hono';
import type { AppEnv } from '../env';
import { notImplemented } from '../lib/todo';
import { householdAuth } from '../middleware/auth';

export const rewards = new Hono<AppEnv>();

rewards.use('*', householdAuth);

// Result card after settlement: verified cut, bill credit, barangay bonus, points.
rewards.get('/by-alert/:alertId', (c) => notImplemented(c, 'result card'));

// Running points and credit totals.
rewards.get('/summary', (c) => notImplemented(c, 'rewards summary'));
