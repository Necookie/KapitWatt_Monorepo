import { useLocalSearchParams } from 'expo-router';
import { useBrownoutRisk } from '@/utils/brownout';
import { useAlert, useAlertTotals, useMe, useMyEventStatus, useRefreshAll } from '@/api/queries';
import { openEventAction } from '@/utils/event-action';
import type { NextStep } from '@/utils/next-step';
import { useServerNow } from '@/utils/server-time';
import { countdownTarget, eventPhase } from '@/utils/event-phase';
import { eventSteps, type NowAction } from '@/utils/event-steps';
import { MOOD } from '@/utils/event-mood';

/**
 * The event in the route and what the event screen renders from it: phase, countdown, the one
 * thing to do now, the step checklist and the household's barangay. Polls about every 2 s
 * through the query hooks.
 */
export function useEvent() {
  const { alertId } = useLocalSearchParams<{ alertId: string }>();
  const alert = useAlert(alertId);
  const status = useMyEventStatus(alertId);
  const totals = useAlertTotals(alertId);
  const me = useMe();
  const refreshAll = useRefreshAll();
  const now = useServerNow();
  const risk = useBrownoutRisk(alert.data?.alert, me.data?.barangayId);

  if (alert.isPending || status.isPending || totals.isPending || me.isPending) {
    return { state: 'pending' as const, refreshAll };
  }
  if (alert.isError || status.isError || totals.isError || me.isError) {
    return { state: 'error' as const, refreshAll };
  }

  const view = alert.data;
  const phase = eventPhase(view, now);
  const countdown = countdownTarget(view, phase);
  const { now: nowCard, steps } = eventSteps({
    view,
    phase,
    status: status.data,
    meterType: me.data.meterType,
    commitCapKw: me.data.commitCapKw ?? 0,
    now,
  });
  const commitment = status.data.commitment;
  const myBarangay = totals.data.barangays.find((b) => b.barangayId === me.data.barangayId);
  const mood = MOOD[phase];
  const live = nowCard.showLiveReduction ? status.data.liveReductionKw : null;

  const runAction = (kind: NowAction) => openEventAction(alertId, kind);
  // The same card as Home's; the countdown is in the band and the steps are listed with times.
  const nextStep: NextStep = {
    kind: 'event',
    card: nowCard,
    mood,
    steps: null,
    countdown: null,
    onAction: runAction,
  };

  return {
    state: 'ready' as const,
    refreshAll,
    view,
    settled: phase === 'settled',
    risk,
    countdown,
    commitment,
    nowCard,
    steps,
    myBarangay,
    mood,
    live,
    runAction,
    nextStep,
  };
}
