import type { Context } from 'hono';
import { createMiddleware } from 'hono/factory';
import type { AppEnv, RateLimitBinding } from '../env';
import { AppError } from '../lib/errors';

/** Client IP as Cloudflare sees it. Phones on one hotspot share it, so IP limits are generous. */
export const clientIp = (c: Context<AppEnv>) => c.req.header('cf-connecting-ip') ?? 'unknown';

/**
 * Workers Rate Limiting. Limits and periods are set per binding in wrangler.jsonc. When the binding is
 * absent (unit tests) the check is skipped.
 */
export const rateLimit = (binding: RateLimitBinding, key: (c: Context<AppEnv>) => string) =>
  createMiddleware<AppEnv>(async (c, next) => {
    const limiter = c.env[binding];
    if (limiter) {
      const { success } = await limiter.limit({ key: key(c) });
      if (!success) {
        c.header('Retry-After', '60');
        throw new AppError(429, 'rate_limited', 'Too many requests. Try again in a minute.');
      }
    }
    await next();
  });
