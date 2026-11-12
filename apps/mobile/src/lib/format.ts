/** Display helpers. kW to 0.1, kWh to 0.1, PHP to 2 decimals (matches the plan's rounding). */

export const formatKw = (kw: number) => `${kw.toFixed(1)} kW`;
export const formatKwh = (kwh: number) => `${kwh.toFixed(1)} kWh`;
export const formatPhp = (php: number) => `PHP ${php.toFixed(2)}`;

const pad = (n: number) => String(n).padStart(2, '0');

/** 24-hour clock in the phone's timezone, e.g. "18:00". */
export function formatClock(iso: string | number): string {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** "1:05:09" or "4:09"; never negative. */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
