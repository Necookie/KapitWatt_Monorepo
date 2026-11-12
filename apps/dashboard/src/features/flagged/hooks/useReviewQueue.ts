import type { FlaggedReading, ReadingFlag } from '@kapitwatt/shared';
import { useState } from 'react';
import type { Decision, useReviewReading } from '../api/useReviewReading';

/**
 * The queue's state: the flag filter, the selected reading (the first shown when none is picked),
 * counts per flag, the oldest capture, and deciding the selected reading so the next one opens.
 */
export function useReviewQueue(all: FlaggedReading[], review: ReturnType<typeof useReviewReading>) {
  const [filter, setFilter] = useState<ReadingFlag | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  // Decided here: they collapse out of the queue while the list refetches without them.
  const [decided, setDecided] = useState<ReadonlySet<string>>(() => new Set());

  const rows = filter === 'all' ? all : all.filter((r) => r.flags.includes(filter));
  const selected =
    rows.find((r) => r.id === selectedId && !decided.has(r.id)) ??
    rows.find((r) => !decided.has(r.id));
  const counts = new Map<ReadingFlag, number>();
  for (const r of all) for (const f of r.flags) counts.set(f, (counts.get(f) ?? 0) + 1);
  const oldest = all.reduce<string | null>(
    (min, r) => (min === null || r.capturedAt < min ? r.capturedAt : min),
    null,
  );

  const decide = (decision: Decision) => {
    if (!selected || review.isPending) return;
    // The one after this in the list opens next (or the one before, at the end).
    const open = rows.filter((r) => !decided.has(r.id));
    const i = open.findIndex((r) => r.id === selected.id);
    const next = open[i + 1] ?? open[i - 1];
    review.mutate(
      { id: selected.id, decision },
      {
        onSuccess: () => {
          setDecided((prev) => new Set(prev).add(selected.id));
          setSelectedId(next?.id);
        },
      },
    );
  };

  const deciding =
    review.isPending && review.variables?.id === selected?.id ? review.variables.decision : null;

  return {
    filter,
    setFilter,
    rows,
    selected,
    setSelectedId,
    decided,
    counts,
    oldest,
    decide,
    deciding,
  };
}
