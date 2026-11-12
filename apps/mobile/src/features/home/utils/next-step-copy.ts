import type { EventMood } from '@/utils/event-mood';
import type { NowCard } from '@/utils/event-steps';

/** Before the first alert: the practice run is the next thing to do. */
export const PRACTICE: NowCard = {
  title: 'Take your practice photos',
  body: 'Two meter photos tell us your usual usage. You need them before you can commit to a cut.',
  action: { kind: 'rehearsal', label: 'Start practice' },
};

/** No alert: nothing to do, and Alitaptap dozes until the grid needs help. */
export const QUIET: NowCard = {
  title: 'Nothing to do right now',
  body: 'The grid has enough power. Alitaptap will wake you when it needs help.',
};

/** While the household's own steps for an alert load. */
export const LOADING_EVENT: NowCard = {
  title: 'The grid needs help tonight',
  body: 'Getting your steps…',
};

export const QUIET_MOOD: EventMood = { pose: 'dimmed', tone: 'primary' };
export const PRACTICE_MOOD: EventMood = { pose: 'neutral', tone: 'primary' };
export const ALERT_MOOD: EventMood = { pose: 'alert', tone: 'primary' };
