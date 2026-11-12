import type { SimParams } from '@kapitwatt/shared';
import { expectedOutcome } from '@kapitwatt/sim';
import { useCurrentAlert, useDemoControls, useSimStatus, useTotals } from '@/api/queries';
import { useResetSim } from '../api/useResetSim';
import { useRunEvent } from '../api/useRunEvent';
import { useSeed } from '../api/useSeed';
import { PLAN_TARGET_KW } from '../utils/plan-target';

/** Where the demo stands: simulator status, the alert in force, the run actions and what follows. */
export function useSimulatorState(params: SimParams) {
  const status = useSimStatus();
  const alert = useCurrentAlert();
  const totals = useTotals(alert.data?.id);
  const demo = useDemoControls();
  const seed = useSeed(params);
  const run = useRunEvent(params);
  const reset = useResetSim();

  const households = status.data?.simulatedHouseholds ?? 0;
  const alertStatus = totals.data?.status ?? alert.data?.status;
  // A settled or cancelled alert is history: the next event needs a new one.
  const live = Boolean(alert.data) && alertStatus !== 'settled' && alertStatus !== 'cancelled';
  const canRun = demo && live && alertStatus === 'active' && households > 0;
  const committed = live && (totals.data?.committedKw ?? 0) > 0;
  const targetKw = live && alert.data ? alert.data.targetKw : PLAN_TARGET_KW;
  // An alert may target only some barangays; the run only reaches households there.
  const targeted =
    live && totals.data?.barangays.some((b) => b.households !== undefined)
      ? totals.data.barangays.reduce((sum, b) => sum + (b.households ?? 0), 0)
      : households;
  const expected = expectedOutcome(targeted, params);
  const failed = demo ? (status.error ?? seed.error ?? run.error ?? reset.error) : null;

  return {
    status,
    alert,
    demo,
    seed,
    run,
    reset,
    households,
    live,
    canRun,
    committed,
    targetKw,
    targeted,
    expected,
    failed,
  };
}

export type SimulatorState = ReturnType<typeof useSimulatorState>;
