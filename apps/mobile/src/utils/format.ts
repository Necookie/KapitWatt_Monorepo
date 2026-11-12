/**
 * Display helpers. kW to 0.1, kWh to 0.1, PHP to 2 decimals (matches the plan's rounding).
 * Formats follow DESIGN.md: `₱8.06`, `6:00 PM`, `6:00–8:00 PM`.
 */

export const formatKw = (kw: number) => `${kw.toFixed(1)} kW`;
export const formatKwh = (kwh: number) => `${kwh.toFixed(1)} kWh`;
export const formatPhp = (php: number) => `₱${php.toFixed(2)}`;

const pad = (n: number) => String(n).padStart(2, '0');

/** 12-hour clock in the phone's timezone, e.g. "6:00 PM". */
export function formatClock(iso: string | number): string {
  const d = new Date(iso);
  const h = d.getHours();
  return `${h % 12 === 0 ? 12 : h % 12}:${pad(d.getMinutes())} ${h < 12 ? 'AM' : 'PM'}`;
}

/** A time window, e.g. "6:00–8:00 PM", or "11:00 AM–1:00 PM" across noon. */
export function formatWindow(startIso: string | number, endIso: string | number): string {
  const start = formatClock(startIso);
  const end = formatClock(endIso);
  const [startTime, startHalf] = start.split(' ');
  return startHalf === end.split(' ')[1] ? `${startTime}–${end}` : `${start}–${end}`;
}
