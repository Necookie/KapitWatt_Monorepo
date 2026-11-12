import type { AlertTotals, BarangayTotals } from '@kapitwatt/shared';
import { UpdateTargetsInput } from '@kapitwatt/shared';
import { useEffect, useState } from 'react';
import type { TownTotals } from '@/utils/format';
import { useUpdateTargets } from '../api/useUpdateTargets';

/** Draft state for the operator's barangay target overrides, and the save action. */
export function useTargetDraft(
  town: TownTotals | undefined,
  totals: AlertTotals | undefined,
  alertId: string | undefined,
) {
  /** Typed targets by barangay id while editing; null when not editing. */
  const [draft, setDraft] = useState<Record<string, string> | null>(null);
  const typed = (b: BarangayTotals) => draft?.[b.barangayId] ?? String(b.targetKw);
  const changed = (town?.barangays ?? []).filter(
    (b) => draft?.[b.barangayId] !== undefined && Number(typed(b)) !== b.targetKw,
  );
  const wanted = changed.map((b) => ({ barangayId: b.barangayId, targetKw: Number(typed(b)) }));
  // The same limits the API applies, so Save never sends a request that must fail.
  const invalid =
    changed.some((b) => typed(b).trim() === '') ||
    (wanted.length > 0 && !UpdateTargetsInput.safeParse({ targets: wanted }).success);
  // A draft belongs to one alert: typed targets must never be saved against the next one.
  useEffect(() => setDraft(null), [alertId]);
  const save = useUpdateTargets(alertId, wanted);
  const startEditing = () => setDraft({});
  const stopEditing = () => {
    save.reset();
    setDraft(null);
  };
  const setTarget = (b: BarangayTotals, text: string) =>
    setDraft({ ...draft, [b.barangayId]: text.replace(/[^0-9.]/g, '') });
  // What the barangay targets would add up to across the whole alert, with the edits applied.
  const allTargets = (totals?.barangays ?? []).reduce(
    (sum, b) => sum + (draft?.[b.barangayId] !== undefined ? Number(typed(b)) || 0 : b.targetKw),
    0,
  );

  return {
    editing: draft !== null,
    typed,
    setTarget,
    changedCount: changed.length,
    invalid,
    allTargets,
    save,
    startEditing,
    stopEditing,
  };
}
