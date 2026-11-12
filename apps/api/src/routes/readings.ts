import { MAX_PHOTO_BYTES, ReviewReadingInput, SubmitReadingInput } from '@kapitwatt/shared';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { z } from 'zod';
import type { AppEnv } from '../env';
import { AppError } from '../lib/errors';
import { IdParam } from '../lib/params';
import { notImplemented } from '../lib/todo';
import { validate } from '../lib/validate';
import { householdAuth, operatorAuth } from '../middleware/auth';
import { rateLimit } from '../middleware/rate-limit';
import { requireBucket } from '../services/photos';
import * as readingsService from '../services/readings';

export const readings = new Hono<AppEnv>();

/** Multipart: the SubmitReadingInput fields plus the photo file in the `photo` field. */
const ReadingForm = SubmitReadingInput.extend({ photo: z.instanceof(File) });
/** The photo limit plus room for the form fields and multipart framing. */
const UPLOAD_LIMIT = MAX_PHOTO_BYTES + 64 * 1024;

// Rehearsal, before or after reading. The server timestamps it on the alert's clock, refuses photos
// outside their window, rejects reused photos, stores the photo privately, runs the rule checks and
// flags failures for review. No resubmission.
readings.post(
  '/',
  householdAuth,
  rateLimit('RL_HOUSEHOLD', (c) => `hh:${c.var.householdId}`),
  bodyLimit({
    maxSize: UPLOAD_LIMIT,
    onError: () => {
      throw new AppError(413, 'photo_too_large', 'The photo is too large.');
    },
  }),
  validate('form', ReadingForm),
  async (c) => {
    const { photo, ...input } = c.req.valid('form');
    const result = await readingsService.submitReading(
      c.var.db,
      requireBucket(c.env.PHOTOS),
      c.var.householdId,
      input,
      new Uint8Array(await photo.arrayBuffer()),
      c.env.APP_ENV === 'demo',
    );
    return c.json(result, 201);
  },
);

// Operator review: the photo of a reading, streamed from the private bucket. The dashboard fetches
// it with the operator key and shows it from a blob URL; there is no public link.
readings.get(
  '/:id/photo',
  operatorAuth,
  rateLimit('RL_OPERATOR', () => 'operator'),
  validate('param', IdParam),
  async (c) => {
    const object = await readingsService.readingPhoto(
      c.var.db,
      requireBucket(c.env.PHOTOS),
      c.req.valid('param').id,
    );
    return new Response(object.body, {
      headers: { 'content-type': 'image/jpeg', 'content-disposition': 'inline' },
    });
  },
);

// P1: readings that failed a rule check, for a person to review.
readings.get('/flagged', operatorAuth, (c) => notImplemented(c, 'list flagged readings'));

readings.post('/:id/review', operatorAuth, validate('json', ReviewReadingInput), (c) =>
  notImplemented(c, 'approve or reject flagged reading'),
);
