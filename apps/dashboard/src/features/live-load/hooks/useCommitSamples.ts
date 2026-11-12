import { useMemo } from 'react';

export type Sample = { at: number; kw: number };

/**
 * Committed kW as polled, kept in memory per alert. The API reports only the current total, so the
 * curve starts when this page first sees the alert and survives navigating away (not a reload).
 */
const store = new Map<string, Sample[]>();

/**
 * Records each polled committed total while `recording`; returns the samples so far. Recorded while
 * rendering, not in an effect, so a new total costs one render instead of two. Recording is
 * idempotent (a total equal to the last is not added), so a repeated render adds nothing.
 */
export function useCommitSamples(
  alertId: string | undefined,
  committedKw: number,
  recording: boolean,
) {
  return useMemo(() => {
    if (!alertId) return [];
    const list = store.get(alertId) ?? [];
    store.set(alertId, list);
    const last = list[list.length - 1];
    if (recording && (!last || last.kw !== committedKw)) {
      list.push({ at: Date.now(), kw: committedKw });
    }
    return [...list];
  }, [alertId, committedKw, recording]);
}
