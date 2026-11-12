import type { ApiErrorBody } from '@kapitwatt/shared';
import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { AppEnv } from '../env';
import { logError } from './log';

/**
 * An expected failure with a stable machine-readable code. The message is shown to the caller, so keep
 * it free of internals.
 */
export class AppError extends Error {
  constructor(
    readonly status: ContentfulStatusCode,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const unauthorized = () =>
  new AppError(401, 'unauthorized', 'Missing or invalid credentials.');
export const forbidden = (message = 'Not allowed.') => new AppError(403, 'forbidden', message);
export const notFound = (what = 'Resource') => new AppError(404, 'not_found', `${what} not found.`);
export const conflict = (code: string, message: string) => new AppError(409, code, message);

type Issue = NonNullable<ApiErrorBody['error']['issues']>[number];

export function errorResponse(
  // Any Hono context: the validator hook hands us one without the app's env types.
  c: Context,
  status: ContentfulStatusCode,
  code: string,
  message: string,
  issues?: Issue[],
) {
  const body: ApiErrorBody = {
    error: {
      code,
      message,
      requestId: (c as Context<AppEnv>).get('requestId'),
      ...(issues ? { issues } : {}),
    },
  };
  return c.json(body, status);
}

/** Postgres unique_violation, as thrown by the Neon driver. */
export function isUniqueViolation(err: unknown, constraint?: string): boolean {
  const e = err as { code?: unknown; constraint?: unknown } | null;
  if (e?.code !== '23505') return false;
  return constraint === undefined || e.constraint === constraint;
}

const HTTP_CODES: Partial<Record<number, string>> = {
  400: 'bad_request',
  401: 'unauthorized',
  403: 'forbidden',
  404: 'not_found',
  413: 'payload_too_large',
  429: 'rate_limited',
};

/** app.onError: one envelope for every failure, and no internals in a 500. */
export function handleError(err: unknown, c: Context<AppEnv>) {
  if (err instanceof AppError) return errorResponse(c, err.status, err.code, err.message);
  if (err instanceof HTTPException) {
    // Hono's own errors: malformed JSON or form (400), body too large (413), and so on.
    const status = err.status as ContentfulStatusCode;
    return errorResponse(
      c,
      status,
      HTTP_CODES[status] ?? 'http_error',
      err.message || 'Request failed.',
    );
  }
  if (isUniqueViolation(err)) {
    return errorResponse(c, 409, 'conflict', 'That already exists.');
  }
  logError('unhandled_error', err, { requestId: c.get('requestId'), path: c.req.path });
  return errorResponse(c, 500, 'internal_error', 'Something went wrong. Try again.');
}
