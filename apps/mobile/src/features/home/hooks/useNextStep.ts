import type { HouseholdMe, MockAlertView } from '@kapitwatt/shared';
import { router } from 'expo-router';
import { useMyEventStatus } from '@/api/queries';
import { openEventAction } from '@/utils/event-action';
import { MOOD } from '@/utils/event-mood';
import { countdownTarget, eventPhase } from '@/utils/event-phase';
import { eventSteps, type NowAction } from '@/utils/event-steps';
import type { NextStep } from '@/utils/next-step';
import { useServerNow } from '@/utils/server-time';
import {
  ALERT_MOOD,
  LOADING_EVENT,
  PRACTICE,
  PRACTICE_MOOD,
  QUIET,
  QUIET_MOOD,
} from '../utils/next-step-copy';

/**
 * Home's one thing to do next. During an alert it is the event screen's own "do this now" (the same
 * eventSteps, so the two never disagree), with the checklist and the countdown; before the first
 * alert, the practice run; otherwise nothing, and Alitaptap dozes.
 */
export function useNextStep(
  view: MockAlertView | null | undefined,
  me: HouseholdMe | undefined,
): NextStep {
  const alertId = view?.alert.id ?? '';
  const status = useMyEventStatus(alertId, { enabled: !!view });
  const now = useServerNow();
  const onAction = (kind: NowAction) => openEventAction(alertId, kind);

  if (view) {
    const onDetails = () => router.push({ pathname: '/alert/[alertId]', params: { alertId } });
    if (!status.data || !me) {
      const base = { kind: 'event' as const, steps: null, countdown: null, onAction, onDetails };
      return { ...base, card: LOADING_EVENT, mood: ALERT_MOOD };
    }
    const phase = eventPhase(view, now);
    const { now: card, steps } = eventSteps({
      view,
      phase,
      status: status.data,
      meterType: me.meterType,
      commitCapKw: me.commitCapKw ?? 0,
      now,
    });
    return {
      kind: 'event',
      card,
      mood: MOOD[phase],
      steps,
      countdown: countdownTarget(view, phase),
      onAction,
      onDetails,
    };
  }
  if (me?.needsRehearsal) {
    return {
      kind: 'practice',
      card: PRACTICE,
      mood: PRACTICE_MOOD,
      steps: null,
      countdown: null,
      onAction,
    };
  }
  return { kind: 'quiet', card: QUIET, mood: QUIET_MOOD, steps: null, countdown: null, onAction };
}
