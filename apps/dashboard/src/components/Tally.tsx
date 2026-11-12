import { duration } from '@kapitwatt/tokens';
import { useEffect, useRef, useState } from 'react';
import { reducedMotion } from '@/styles/motion';

const MS = duration.medium4;

/**
 * A figure that counts to its new value (400 ms, easing out) instead of jumping, for totals that
 * move while an event runs. Put it inside a Text; only this re-renders while it counts. The first
 * value shows as is.
 */
export function Tally({ value, format }: { value: number; format: (n: number) => string }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = from.current;
    if (start === value || reducedMotion()) {
      from.current = value;
      setShown(value);
      return;
    }
    const t0 = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const p = Math.min((now - t0) / MS, 1);
      const v = start + (value - start) * (1 - (1 - p) ** 3);
      from.current = v;
      setShown(v);
      if (p < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <>{format(shown)}</>;
}
