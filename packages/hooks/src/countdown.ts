export type Countdown = {
  /** Milliseconds until the target, never below 0. */
  msLeft: number;
  done: boolean;
  hours: number;
  minutes: number;
  seconds: number;
  /** "1:05:09" or "05:09", tabular-friendly. */
  label: string;
};

const pad = (n: number) => String(n).padStart(2, '0');

/** Pure part of useCountdown, separated so it can be tested without React. */
export function countdown(targetMs: number, nowMs: number): Countdown {
  const msLeft = Math.max(0, targetMs - nowMs);
  const total = Math.ceil(msLeft / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return {
    msLeft,
    done: msLeft === 0,
    hours,
    minutes,
    seconds,
    label:
      hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`,
  };
}
