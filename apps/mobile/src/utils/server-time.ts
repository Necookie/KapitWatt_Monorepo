import { useEffect, useState } from 'react';

/**
 * Countdowns and deadlines follow the server clock, never the phone clock (NFR-R2).
 * Every household response carries `serverTime`; we keep the offset and apply it to Date.now().
 */
let offsetMs = 0;

export function syncServerTime(serverTimeIso: string) {
  offsetMs = new Date(serverTimeIso).getTime() - Date.now();
}

export function serverNow(): number {
  return Date.now() + offsetMs;
}

/** How far the server clock is ahead of the phone's (ms), for the shared useCountdown. */
export function serverOffsetMs(): number {
  return offsetMs;
}

/** Server-corrected "now", re-rendering every second. */
export function useServerNow(intervalMs = 1000): number {
  const [now, setNow] = useState(serverNow);
  useEffect(() => {
    const id = setInterval(() => setNow(serverNow()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
