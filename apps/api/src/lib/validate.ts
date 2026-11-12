import { zValidator as zv } from '@hono/zod-validator';
import type { ValidationTargets } from 'hono';
import type { ZodType } from 'zod';
import { errorResponse } from './errors';

/**
 * zValidator with the API's error envelope. Every route validates its json, form, query and params
 * through this, so a bad request always gets the same 400 shape and never echoes internals.
 */
export const validate = <Target extends keyof ValidationTargets, Schema extends ZodType>(
  target: Target,
  schema: Schema,
) =>
  zv(target, schema, (result, c) => {
    if (!result.success) {
      const issues = result.error.issues.map((i) => ({
        path: i.path.map(String).join('.') || target,
        message: i.message,
      }));
      return errorResponse(c, 400, 'invalid_request', 'Request validation failed.', issues);
    }
  });
