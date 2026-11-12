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

  const rows = filter === 'all' ? all : all.filter((r) => r.flags.includes(filter));
  const selected = rows.find((r) => r.id === selectedId) ?? rows[0];
  const counts = new Map<ReadingFlag, number>();
  for (const r of all) for (const f of r.flags) counts.set(f, (counts.get(f) ?? 0) + 1);
  const oldest = all.reduce<string | null>(
    (min, r) => (min === null || r.capturedAt < min ? r.capturedAt : min),
    null,
  );

  const decide = (decision: Decision) => {
    if (!selected || review.isPending) return;
    // The one after this in the list opens next (or the one before, at the end).
    const i = rows.findIndex((r) => r.id === selected.id);
    const next = rows[i + 1] ?? rows[i - 1];
    review.mutate({ id: selected.id, decision }, { onSuccess: () => setSelectedId(next?.id) });
  };

  const deciding =
    review.isPending && review.variables?.id === selected?.id ? review.variables.decision : null;

  return { filter, setFilter, rows, selected, setSelectedId, counts, oldest, decide, deciding };
}
