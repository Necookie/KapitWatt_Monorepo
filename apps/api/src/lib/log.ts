/**
 * Structured logs, one JSON object per line. Never pass headers, bodies, tokens, keys, meter readings,
 * GPS positions or serials in `fields`: logs are not covered by the consent households gave.
 */
type Fields = Record<string, string | number | boolean | null | undefined>;

export function logInfo(event: string, fields: Fields = {}): void {
  console.log(JSON.stringify({ level: 'info', event, ...fields }));
}

export function logWarn(event: string, fields: Fields = {}): void {
  console.warn(JSON.stringify({ level: 'warn', event, ...fields }));
}

/**
 * Logs an error by name, message, Postgres code and stack. Driver `detail` fields are left out on
 * purpose: they can echo row values (hashes, readings).
 */
export function logError(event: string, err: unknown, fields: Fields = {}): void {
  const e = err instanceof Error ? err : new Error(String(err));
  const code = (err as { code?: unknown } | null)?.code;
  console.error(
    JSON.stringify({
      level: 'error',
      event,
      ...fields,
      error: e.name,
      message: e.message,
      code: typeof code === 'string' ? code : undefined,
      stack: e.stack,
    }),
  );
}
