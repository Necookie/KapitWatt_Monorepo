import type { Context } from 'hono';

/** Placeholder for a route that is wired up but not built yet. */
export const notImplemented = (c: Context, what: string) =>
  c.json({ error: 'not_implemented', what }, 501);
