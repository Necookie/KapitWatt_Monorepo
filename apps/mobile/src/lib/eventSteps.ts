import type { MockAlertView, MeterType, MyEventStatus } from '@kapitwatt/shared';
import type { EventPhase } from './eventPhase';
import { formatClock } from './format';

/**
 * Turns the event's state into (1) the one thing the household should do now and (2) a checklist
 * of steps. Pure, so the event screen only renders what this returns.
 */

export type StepState = 'done' | 'now' | 'later' | 'missed';

export interface Step {
  key: string;
  title: string;
  /** Short time hint, e.g. "18:00 to 18:15". */
  when?: string;
  state: StepState;
}

export type NowAction = 'commit' | 'rehearsal' | 'before' | 'after' | 'result';

export interface NowCard {
  title: string;
  body: string;
  action?: { kind: NowAction; label: string };
  /** Highlight the live reduction (smart meter, window open). */
  showLiveReduction?: boolean;
}

export interface EventSteps {
  now: NowCard;
  steps: Step[];
}

interface Input {
  view: MockAlertView;
  phase: EventPhase;
  status: MyEventStatus;
  meterType: MeterType;
  commitCapKw: number;
  now: number;
}

const t = (iso: string) => new Date(iso).getTime();

export function eventSteps({
  view,
  phase,
  status,
  meterType,
  commitCapKw,
  now,
}: Input): EventSteps {
  const { alert } = view;
  const committed = status.commitment !== null;
  const isPhoto = meterType === 'standard';
  const has = (kind: 'before' | 'after') => status.readings.some((r) => r.kind === kind);
  const beforeOpen = now >= t(alert.windowStart) && now <= t(view.beforePhotoDueAt);
  const afterOpen = now >= t(view.afterPhotoOpensAt) && now <= t(view.afterPhotoDueAt);
  const beforeMissed = !has('before') && now > t(view.beforePhotoDueAt);
  const afterMissed = !has('after') && now > t(view.afterPhotoDueAt);
  const windowText = `${formatClock(alert.windowStart)} to ${formatClock(alert.windowEnd)}`;
  const canStillCommit = phase === 'before_window' || phase === 'window_open';

  // ----- Checklist -----
  const steps: Step[] = [];
  steps.push({
    key: 'commit',
    title: 'Commit a cut',
    state: committed ? 'done' : canStillCommit ? 'now' : 'missed',
  });
  if (isPhoto) {
    steps.push({
      key: 'before',
      title: 'Before photo',
      when: `${formatClock(alert.windowStart)} to ${formatClock(view.beforePhotoDueAt)}`,
      state: has('before')
        ? 'done'
        : beforeMissed
          ? 'missed'
          : committed && beforeOpen
            ? 'now'
            : 'later',
    });
    steps.push({
      key: 'after',
      title: 'After photo',
      when: `${formatClock(view.afterPhotoOpensAt)} to ${formatClock(view.afterPhotoDueAt)}`,
      state: has('after')
        ? 'done'
        : afterMissed
          ? 'missed'
          : committed && afterOpen
            ? 'now'
            : 'later',
    });
  } else {
    steps.push({
      key: 'cut',
      title: 'Cut your usage',
      when: windowText,
      state:
        phase === 'window_open' && committed
          ? 'now'
          : phase === 'settling' || phase === 'settled'
            ? committed
              ? 'done'
              : 'missed'
            : 'later',
    });
  }
  steps.push({
    key: 'result',
    title: 'See your result',
    when: formatClock(view.settlesAt),
    state: phase === 'settled' && committed ? 'now' : 'later',
  });

  // ----- The one thing to do now -----
  const nowCard = ((): NowCard => {
    if (phase === 'cancelled') {
      return { title: 'Alert lifted', body: 'The grid no longer needs help. Thank you.' };
    }
    if (!committed) {
      if (!canStillCommit) {
        return { title: 'You did not join this event', body: 'We will alert you again next time.' };
      }
      if (commitCapKw <= 0) {
        return {
          title: 'Finish your practice run',
          body: 'Two practice meter photos tell us your usual usage. You need them before you can commit.',
          action: { kind: 'rehearsal', label: 'Start practice' },
        };
      }
      return {
        title: 'Commit to cutting power',
        body: `Choose how many kW your household will cut from ${windowText}.`,
        action: { kind: 'commit', label: 'Commit a cut' },
      };
    }

    if (phase === 'settled') {
      return {
        title: 'Your result is ready',
        body: 'See how much energy you saved and what you earned.',
        action: { kind: 'result', label: 'See your result' },
      };
    }
    if (phase === 'before_window') {
      return {
        title: "You're set. Get ready",
        body: isPhoto
          ? `When the window opens at ${formatClock(alert.windowStart)}, take a photo of your meter.`
          : `From ${formatClock(alert.windowStart)}, switch off what you can. Your smart meter does the rest.`,
      };
    }
    if (isPhoto && beforeOpen && !has('before')) {
      return {
        title: 'Take your before photo',
        body: `Photograph your meter now. Due by ${formatClock(view.beforePhotoDueAt)}.`,
        action: { kind: 'before', label: 'Take before photo' },
      };
    }
    if (phase === 'window_open') {
      return {
        title: 'Cut your power now',
        body:
          (isPhoto && beforeMissed
            ? 'Your before photo was missed, so this event cannot be paid. '
            : '') + `Keep usage low until ${formatClock(alert.windowEnd)}.`,
        showLiveReduction: !isPhoto,
      };
    }
    if (isPhoto && afterOpen && !has('after')) {
      return {
        title: 'Take your after photo',
        body: `The window is over. Photograph your meter by ${formatClock(view.afterPhotoDueAt)}.`,
        action: { kind: 'after', label: 'Take after photo' },
      };
    }
    return {
      title: 'Waiting for results',
      body:
        (isPhoto && (beforeMissed || afterMissed) ? 'A meter photo was missed. ' : '') +
        `Results arrive at ${formatClock(view.settlesAt)}.`,
    };
  })();

  return { now: nowCard, steps };
}
