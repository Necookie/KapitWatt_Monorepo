import type { Context } from 'hono';
import { errorResponse } from './errors';

/** Placeholder for a route that is wired up but not built yet. Same error envelope as every other failure. */
export const notImplemented = (c: Context, what: string) =>
  errorResponse(c, 501, 'not_implemented', `Not built yet: ${what}.`);
