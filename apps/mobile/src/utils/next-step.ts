import type { EventMood } from '@/utils/event-mood';
import type { NowAction, NowCard, Step } from '@/utils/event-steps';

/** The one thing to do next, as Home and the event screen show it (NextStepCard). */
export interface NextStep {
  kind: 'event' | 'practice' | 'quiet';
  card: NowCard;
  mood: EventMood;
  /** The event's checklist (commit, photos or the cut, result); none outside an alert. */
  steps: Step[] | null;
  countdown: { label: string; at: string } | null;
  onAction: (kind: NowAction) => void;
  /** Opens the event screen (during an alert). */
  onDetails?: () => void;
}
