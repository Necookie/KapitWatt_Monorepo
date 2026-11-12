import { CreateAlertInput, DEFAULT_WINDOW_HOURS, type AlertLevel } from '@kapitwatt/shared';
import { expectedOutcome } from '@kapitwatt/sim';
import { useMemo, useState } from 'react';
import { toLocalInput } from '@/utils/datetime';
import { useBarangays } from '@/api/queries';
import { useSimParams } from '@/hooks/sim-params';
import { about, clock, dayAndClock, kw, percent, power } from '@/utils/format';
import {
  DEFAULT_TARGET_KW,
  KW_PER,
  defaultMessage,
  type TargetUnit,
  toKw,
  tonightAt,
} from '../utils/alert-defaults';
import { groupByTown } from '../utils/barangays';

/** The send-alert form: its state, the values derived from it, and the alert it would send. */
export function useAlertForm() {
  const { params } = useSimParams();
  const barangays = useBarangays();

  const [level, setLevel] = useState<AlertLevel>('red');
  const [start, setStart] = useState(() => toLocalInput(tonightAt(18)));
  const [hours, setHours] = useState<number>(DEFAULT_WINDOW_HOURS);
  const [target, setTarget] = useState<string | null>(null);
  const [unit, setUnit] = useState<TargetUnit>('kW');
  const [message, setMessage] = useState<string | null>(null);
  /** Null means all pilot areas. */
  const [picked, setPicked] = useState<Set<string> | null>(null);

  const all = barangays.data ?? [];
  const selected = picked ?? new Set(all.map((b) => b.id));
  const everything = all.length > 0 && selected.size === all.length;

  const startDate = new Date(start);
  const validStart = !Number.isNaN(startDate.getTime());
  const endDate = new Date((validStart ? startDate.getTime() : Date.now()) + hours * 3_600_000);
  const targetText = target ?? String(DEFAULT_TARGET_KW[level] / KW_PER[unit]);
  const changeUnit = (next: TargetUnit) => {
    // Keep the amount, change how it is written: 600 kW becomes 0.6 MW.
    if (target !== null && target !== '') {
      setTarget(String(toKw(Number(target), unit) / KW_PER[next]));
    }
    setUnit(next);
  };
  const messageText =
    message ?? defaultMessage(level, validStart ? startDate : new Date(), endDate);

  const byTown = useMemo(() => groupByTown(all), [all]);

  const chosen = all.filter((b) => selected.has(b.id));
  const townCount = new Set(chosen.map((b) => b.municipality)).size;
  const knowsHouseholds = chosen.some((b) => b.optedInHouseholds !== undefined);
  const households = chosen.reduce((sum, b) => sum + (b.optedInHouseholds ?? 0), 0);

  const input = {
    level,
    windowStart: validStart ? startDate.toISOString() : '',
    windowEnd: endDate.toISOString(),
    targetKw: toKw(Number(targetText), unit),
    // An empty list is the API's way of saying "all pilot areas".
    targetBarangayIds: everything ? [] : chosen.map((b) => b.id),
    message: messageText.trim(),
  };
  const parsed = CreateAlertInput.safeParse(input);
  const problem = !validStart
    ? 'Enter a start time.'
    : chosen.length === 0
      ? 'Pick at least one barangay.'
      : !(input.targetKw > 0)
        ? `Enter a target above 0 ${unit}.`
        : input.message.length === 0
          ? 'The message cannot be empty.'
          : parsed.success
            ? null
            : 'Check the form values.';

  const toggle = (ids: string[], on: boolean) => {
    const next = new Set(selected);
    for (const id of ids) {
      if (on) next.add(id);
      else next.delete(id);
    }
    setPicked(next);
  };
  const pickAll = (on: boolean) => setPicked(on ? null : new Set());

  const levelName = level === 'red' ? 'red' : 'yellow';
  const reach = `${townCount} ${townCount === 1 ? 'town' : 'towns'}${
    knowsHouseholds ? `, ${about(households)} households` : ''
  }`;

  // Same arithmetic as the target's forecast line: opted-in households in these areas x the
  // simulation's participation, cut and follow-through.
  const outcome = knowsHouseholds ? expectedOutcome(households, params) : undefined;
  const title = `${level === 'red' ? 'Red alert' : 'Yellow alert'}: cut load ${
    validStart ? clock(startDate.toISOString()) : ''
  } to ${clock(endDate.toISOString())}`;

  const summaryRows = [
    {
      label: 'Window',
      value: validStart
        ? `${dayAndClock(startDate.toISOString())} to ${clock(endDate.toISOString())} (${hours} h)`
        : '—',
    },
    { label: 'Reach', value: reach },
    { label: 'Target', value: input.targetKw > 0 ? power(input.targetKw) : '—' },
    {
      label: 'Forecast',
      value:
        outcome && input.targetKw > 0
          ? `≈ ${kw(Math.round(outcome.deliveredKw))} kW (${percent(outcome.deliveredKw, input.targetKw)}), an assumption`
          : '—',
    },
  ];

  const confirmHeadline = `Send ${levelName} alert to ${reach}?`;
  const confirmBody = `Peak window ${validStart ? dayAndClock(startDate.toISOString()) : ''} to ${clock(
    endDate.toISOString(),
  )}. Target ${power(input.targetKw || 0)}. Opted-in phones in these barangays are notified straight away, and the alert is logged with your name and the time.`;

  return {
    barangays,
    params,
    level,
    setLevel,
    start,
    setStart,
    hours,
    setHours,
    targetText,
    setTarget,
    unit,
    changeUnit,
    message,
    messageText,
    setMessage,
    byTown,
    selected,
    toggle,
    pickAll,
    households: knowsHouseholds ? households : undefined,
    input,
    problem,
    title,
    summaryRows,
    confirmHeadline,
    confirmBody,
  };
}
