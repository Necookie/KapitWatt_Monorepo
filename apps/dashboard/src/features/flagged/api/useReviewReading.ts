import { client } from '@/api/client';
import { useAction } from '@/api/queries';

export type Decision = 'approve' | 'reject';

/** Approve or reject one flagged reading; every query refreshes once it settles. */
export function useReviewReading() {
  return useAction((input: { id: string; decision: Decision }) =>
    client.reviewReading(input.id, input.decision),
  );
}
