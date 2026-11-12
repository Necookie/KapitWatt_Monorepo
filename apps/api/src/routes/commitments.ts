import { validate } from '../lib/validate';
import { CreateCommitmentInput } from '@kapitwatt/shared';
import { Hono } from 'hono';
import type { AppEnv } from '../env';
import { notImplemented } from '../lib/todo';
import { householdAuth } from '../middleware/auth';

export const commitments = new Hono<AppEnv>();

commitments.use('*', householdAuth);

// Commit a cut in kW. Capped by baseline and trust score; the path comes from the meter type.
commitments.post('/', validate('json', CreateCommitmentInput), (c) =>
  notImplemented(c, 'create commitment'),
);

// This household's commitment for an alert, with photo deadlines and barangay progress.
commitments.get('/by-alert/:alertId', (c) => notImplemented(c, 'get commitment for alert'));

// Past events.
commitments.get('/history', (c) => notImplemented(c, 'commitment history'));
