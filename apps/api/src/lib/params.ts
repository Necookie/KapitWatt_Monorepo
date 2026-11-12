import { z } from 'zod';

/** Path params are validated like bodies: an id that is not a UUID never reaches the database. */
export const IdParam = z.object({ id: z.uuid() });
export const AlertIdParam = z.object({ alertId: z.uuid() });

/** Idempotency-Key header: 8 to 100 URL-safe characters (the dashboard sends a UUID per confirm). */
export const IDEMPOTENCY_KEY = /^[A-Za-z0-9_-]{8,100}$/;

export const LimitQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
