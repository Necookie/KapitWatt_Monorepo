import type { Context } from 'hono';
import type { AppEnv } from '../env';
import { logError } from './log';

/**
 * Runs work after the response (push dispatch and similar). A failure is logged, never thrown, so it
 * cannot fail the request or surface as an unhandled rejection. Without an ExecutionContext (unit
 * tests) the promise simply runs.
 */
export function defer(c: Context<AppEnv>, label: string, task: Promise<unknown>): void {
  const guarded = task.catch((err) => logError(label, err, { requestId: c.get('requestId') }));
  try {
    c.executionCtx.waitUntil(guarded);
  } catch {
    void guarded;
  }
}
