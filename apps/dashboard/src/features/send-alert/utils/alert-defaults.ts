import { DEFAULT_WINDOW_HOURS, type AlertLevel } from '@kapitwatt/shared';
import { clock } from '@/utils/format';

/** The operator can type the target in either unit (PRD: "kW or MW of relief wanted"). */
export type TargetUnit = 'kW' | 'MW';
export const KW_PER: Record<TargetUnit, number> = { kW: 1, MW: 1000 };

/** Form defaults only: a red alert asks for a bigger cut than a yellow one (FR-DASH-01). */
export const DEFAULT_TARGET_KW: Record<AlertLevel, number> = { yellow: 300, red: 600 };

/** Window lengths offered, in hours. */
export const DURATIONS = [1, DEFAULT_WINDOW_HOURS, 3];

/** Target presets, in kW. */
export const PRESETS_KW = [300, 600, 900];

/** Keeps 0.6 MW at 600 kW rather than 600.0000000001. */
export const toKw = (value: number, unit: TargetUnit) =>
  Math.round(value * KW_PER[unit] * 100) / 100;

/** Today at `hour`, or tomorrow if that has passed. */
export function tonightAt(hour: number): Date {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  if (date.getTime() <= Date.now()) date.setDate(date.getDate() + 1);
  return date;
}

/** `minutes` from now, on the minute. */
export function inMinutes(minutes: number): Date {
  const date = new Date(Date.now() + minutes * 60_000);
  date.setSeconds(0, 0);
  return date;
}

/** The message households get, written from the level and window; the operator can edit it. */
export function defaultMessage(level: AlertLevel, start: Date, end: Date): string {
  const window = `${clock(start.toISOString())} to ${clock(end.toISOString())}`;
  return level === 'red'
    ? `Red alert on the Luzon grid. Brownouts are possible. Please cut your load from ${window}. Open KapitWatt to commit a cut and earn bill credit.`
    : `Yellow alert on the Luzon grid. Supply is tight. Please cut your load from ${window} if you can. Open KapitWatt to commit a cut and earn bill credit.`;
}

/** How long the send button shows its check before the page moves to the live view. */
export const SENT_PAUSE_MS = 700;
