import { useEffect, useState } from 'react';

export type Sample = { at: number; kw: number };

/**
 * Committed kW as polled, kept in memory per alert. The API reports only the current total, so the
 * curve starts when this page first sees the alert and survives navigating away (not a reload).
 */
const store = new Map<string, Sample[]>();

/** Records each polled committed total while `recording`; returns the samples so far. */
export function useCommitSamples(
  alertId: string | undefined,
  committedKw: number,
  recording: boolean,
) {
  const [samples, setSamples] = useState<Sample[]>(() =>
    alertId ? (store.get(alertId) ?? []) : [],
  );
  useEffect(() => {
    if (!alertId) return;
    const list = store.get(alertId) ?? [];
    if (recording) {
      const last = list[list.length - 1];
      if (!last || last.kw !== committedKw) {
        list.push({ at: Date.now(), kw: committedKw });
        store.set(alertId, list);
      }
    }
    setSamples([...list]);
  }, [alertId, committedKw, recording]);
  return samples;
}
