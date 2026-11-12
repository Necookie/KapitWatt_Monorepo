import { router, useLocalSearchParams } from 'expo-router';
import { useBrownoutRisk } from '@/utils/brownout';
import { useAlert, useAlertTotals, useMe, useMyEventStatus, useRefreshAll } from '@/api/queries';
import { useServerNow } from '@/utils/server-time';
import { countdownTarget, eventPhase } from '../utils/event-phase';
import { eventSteps, type NowAction } from '../utils/event-steps';
import { MOOD } from '../utils/event-mood';

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

  const runAction = (kind: NowAction) => {
    if (kind === 'rehearsal') router.push('/rehearsal');
    else if (kind === 'commit')
      router.push({ pathname: '/alert/[alertId]/commit', params: { alertId } });
    else if (kind === 'result')
      router.push({ pathname: '/alert/[alertId]/result', params: { alertId } });
    else router.push({ pathname: '/alert/[alertId]/capture', params: { alertId, kind } });
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
  };
}
