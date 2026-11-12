import { validate } from '../lib/validate';
import { ReviewReadingInput } from '@kapitwatt/shared';
import { Hono } from 'hono';
import type { AppEnv } from '../env';
import { notImplemented } from '../lib/todo';
import { householdAuth, operatorAuth } from '../middleware/auth';

export const readings = new Hono<AppEnv>();

// Rehearsal, before or after reading: multipart form with the photo file plus
// SubmitReadingInput fields. Timestamp on the server, store the photo privately,
// run the rule checks (timing, serial, GPS, reading value, duplicate hash) and
// flag failures. No resubmission.
readings.post('/', householdAuth, (c) => notImplemented(c, 'submit meter reading'));

// P1: readings that failed a rule check, for a person to review.
readings.get('/flagged', operatorAuth, (c) => notImplemented(c, 'list flagged readings'));

readings.post('/:id/review', operatorAuth, validate('json', ReviewReadingInput), (c) =>
  notImplemented(c, 'approve or reject flagged reading'),
);
