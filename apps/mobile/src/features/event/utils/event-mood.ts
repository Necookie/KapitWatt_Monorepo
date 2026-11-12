import type { MascotPose } from '@kapitwatt/ui';
import type { EventPhase } from './event-phase';

export interface EventMood {
  pose: MascotPose;
  tone: 'primary' | 'reward';
}

/** The mascot's mood follows the event: calm, cutting power, then celebrating. */
export const MOOD: Record<EventPhase, EventMood> = {
  before_window: { pose: 'neutral', tone: 'primary' },
  window_open: { pose: 'dimmed', tone: 'primary' },
  settling: { pose: 'neutral', tone: 'primary' },
  settled: { pose: 'reward', tone: 'reward' },
  cancelled: { pose: 'neutral', tone: 'primary' },
};
