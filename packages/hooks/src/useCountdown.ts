import { useEffect, useState } from 'react';
import { countdown, type Countdown } from './countdown';

/**
 * Ticks once a second until `target` (Date, ISO string or epoch ms).
 * `serverOffsetMs` = server time minus phone time; pass it so photo deadlines follow the server clock
 * (the API decides payouts on server time, never the phone's).
 */
export function useCountdown(target: Date | string | number, serverOffsetMs = 0): Countdown {
  const targetMs = new Date(target).getTime();
  const [now, setNow] = useState(() => Date.now() + serverOffsetMs);
  const state = countdown(targetMs, now);

  useEffect(() => {
    if (state.done) return;
    const id = setInterval(() => setNow(Date.now() + serverOffsetMs), 1000);
    return () => clearInterval(id);
  }, [state.done, serverOffsetMs]);

  return state;
}
