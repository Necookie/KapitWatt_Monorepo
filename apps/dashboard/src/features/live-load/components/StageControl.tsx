import type { AlertStatus } from '@kapitwatt/shared';
import { StyleSheet, View } from 'react-native';
import { client, errorMessage, type DashboardAlert } from '@/api/client';
import { useAction, useCommitRunInProgress, useDemoControls, useSimStatus } from '@/api/queries';
import { STAGES, stageHint, stageIndex } from '../utils/stages';
import { useSimParams } from '@/hooks/sim-params';
import { colors, space } from '@/styles/theme';
import { Button as UiButton } from '@kapitwatt/ui';
import { Notice } from '@/components/ui/Notice';
import { Txt } from '@/components/ui/Txt';

/**
 * The operator moves an event through its four stages on cue instead of waiting on a
 * real clock. Demo controls only (FR-DASH-07): outside the demo environment the stepper
 * still shows where the event stands, with no buttons.
 *
 *   Sent ── Open window ──► Window open ── End window ──► Measuring ── Settle ──► Settled
 *     └─────────────── Measure (fast-forward): all of it in one click ───────────────┘
 *
 * The single steps stay because real phones need the gaps: a before photo while the
 * window is open, an after photo once it has ended.
 */
export function StageControl({
  alert,
  status,
  stepper = true,
}: {
  alert: DashboardAlert;
  status: AlertStatus;
  /** False where the page shows the stages itself (Live load hero): only the demo buttons and guidance. */
  stepper?: boolean;
}) {
  const { params } = useSimParams();
  const sim = useSimStatus();
  const hasSimulated = (sim.data?.simulatedHouseholds ?? 0) > 0;
  // Ending the window before the count is known would skip the simulated readings, and a
  // settled alert cannot be reopened. If the simulator cannot be reached there are none to wait for.
  const simKnown = sim.data !== undefined || sim.isError;

  const open = useAction(() => client.fastForward(alert.id, 'window_start'));
  // The fake meter feed reports once the window has ended. Real phones send their own photos.
  const deliver = useAction(() => client.simRun(alert.id, params, 'deliver'));
  const end = useAction(async () => {
    await client.fastForward(alert.id, 'window_end');
    if (hasSimulated) await deliver.mutateAsync(undefined);
  });
  const settle = useAction(() => client.settle(alert.id));
  // One click: end the window (which compresses the photo timers), take the simulated
  // readings, settle. If a step fails the event stays where it got to and the single
  // steps finish it.
  const measure = useAction(async () => {
    await client.fastForward(alert.id, 'window_end');
    if (hasSimulated) await client.simRun(alert.id, params, 'deliver');
    await client.settle(alert.id);
  });
  const committing = useCommitRunInProgress();
  const demo = useDemoControls();

  const current = stageIndex(status);
  const failed = open.error ?? end.error ?? deliver.error ?? settle.error ?? measure.error;
  const beforeEnd = status === 'scheduled' || status === 'active' || status === 'window_open';
  const working = measure.isPending || open.isPending || end.isPending || settle.isPending;

  return (
    <View style={{ gap: space.md }}>
      <View style={styles.row}>
        {stepper ? (
          <View style={styles.steps} accessibilityRole={'list' as never}>
            {STAGES.map((name, i) => {
              const done = i < current;
              const now = i === current;
              return (
                <View key={name} style={styles.step}>
                  {i > 0 ? (
                    <View style={[styles.rail, i <= current ? styles.railDone : null]} />
                  ) : null}
                  <View
                    style={[styles.dot, done ? styles.dotDone : null, now ? styles.dotNow : null]}
                  >
                    <Txt
                      size="xs"
                      weight="700"
                      style={{ color: done || now ? '#FFFFFF' : colors.muted }}
                    >
                      {done ? '✓' : i + 1}
                    </Txt>
                  </View>
                  <Txt size="sm" weight={now ? '600' : '400'} tone={now ? 'ink' : 'muted'}>
                    {name}
                  </Txt>
                </View>
              );
            })}
          </View>
        ) : null}

        {demo ? (
          <View style={styles.actions}>
            {status === 'active' || status === 'scheduled' ? (
              <UiButton
                variant="outlined"
                label="Open window"
                loading={open.isPending}
                // Opening the window closes commits, which would cut a paced run short.
                disabled={committing || working}
                onPress={() => open.mutate(undefined)}
              />
            ) : null}
            {status === 'window_open' ? (
              <UiButton
                variant="outlined"
                label="End window"
                loading={end.isPending}
                disabled={working || !simKnown}
                onPress={() => end.mutate(undefined)}
              />
            ) : null}
            {beforeEnd ? (
              <UiButton
                label="Measure (fast-forward)"
                loading={measure.isPending}
                disabled={committing || working || !simKnown}
                onPress={() => measure.mutate(undefined)}
              />
            ) : null}
            {status === 'settling' && hasSimulated && (deliver.isError || measure.isError) ? (
              // The window ended but the simulated readings did not arrive. Sending them
              // again is safe: a household keeps one reading per kind.
              <UiButton
                variant="outlined"
                label="Resend simulated readings"
                loading={deliver.isPending}
                onPress={() => deliver.mutate(undefined)}
              />
            ) : null}
            {status === 'settling' ? (
              <UiButton
                label="Settle results"
                loading={settle.isPending}
                disabled={deliver.isPending || measure.isPending}
                onPress={() => settle.mutate(undefined)}
              />
            ) : null}
          </View>
        ) : null}
        {!stepper ? (
          // Demo strip: one short line beside the buttons.
          <Txt size="sm" tone="muted" style={{ flex: 1, minWidth: 200 }}>
            {committing && current === 0
              ? 'Simulated households are still committing.'
              : beforeEnd
                ? 'Measure ends the window, takes the readings and settles. The window moves to now.'
                : stageHint(status)}
          </Txt>
        ) : null}
      </View>

      {stepper ? (
        <Txt size="xs" tone="muted">
          {committing && current === 0
            ? 'Simulated households are still committing; the window can open when they finish.'
            : stageHint(status)}{' '}
          {!demo
            ? 'The event follows the real clock: stage controls exist in the demo environment only.'
            : beforeEnd
              ? 'Measure (fast-forward) ends the window, takes the readings and settles in one step. The single steps leave time for real phones to take their photos. Demo control: the window is moved to now, its scheduled length is kept.'
              : 'Demo control: the window is moved to now, its scheduled length is kept.'}
        </Txt>
      ) : null}
      {failed ? <Notice tone="critical">{errorMessage(failed)}</Notice> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.lg,
    flexWrap: 'wrap',
  },
  steps: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', rowGap: space.sm },
  step: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rail: { width: 28, height: 2, marginHorizontal: 6, backgroundColor: colors.border },
  railDone: { backgroundColor: colors.brand },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.track,
  },
  dotDone: { backgroundColor: colors.brand },
  dotNow: { backgroundColor: colors.brandStrong },
  actions: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap', flexShrink: 1 },
});
