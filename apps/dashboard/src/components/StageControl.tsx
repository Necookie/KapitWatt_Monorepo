import type { AlertStatus } from '@kapitwatt/shared';
import { StyleSheet, View } from 'react-native';
import { client, errorMessage, type DashboardAlert } from '@/lib/client';
import { STAGES, stageIndex, useAction, useCommitRunInProgress, useSimStatus } from '@/lib/queries';
import { useSimParams } from '@/lib/sim-params';
import { colors, space } from '@/theme';
import { Button, Notice, Txt } from './ui';

/**
 * The operator walks an event through four stages on cue instead of waiting on a
 * real clock. These are demo controls: they call the fast-forward and settle routes.
 *
 *   Sent ── Open window ──► Window open ── End window and measure ──► Measuring ── Settle ──► Settled
 */
export function StageControl({ alert, status }: { alert: DashboardAlert; status: AlertStatus }) {
  const { params } = useSimParams();
  const sim = useSimStatus();
  const hasSimulated = (sim.data?.simulatedHouseholds ?? 0) > 0;

  const open = useAction(() => client.fastForward(alert.id, 'window_start'));
  // The fake meter feed reports once the window has ended. Real phones send their own photos.
  const deliver = useAction(() => client.simRun(alert.id, params, 'deliver'));
  const end = useAction(async () => {
    await client.fastForward(alert.id, 'window_end');
    if (hasSimulated) await deliver.mutateAsync(undefined);
  });
  const settle = useAction(() => client.settle(alert.id));
  const committing = useCommitRunInProgress();

  const current = stageIndex(status);
  const failed = open.error ?? end.error ?? deliver.error ?? settle.error;

  return (
    <View style={{ gap: space.md }}>
      <View style={styles.row}>
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

        <View style={styles.actions}>
          {status === 'active' || status === 'scheduled' ? (
            <Button
              kind="primary"
              label="Open window"
              busy={open.isPending}
              // Opening the window closes commits, which would cut a paced run short.
              disabled={committing}
              onPress={() => open.mutate(undefined)}
            />
          ) : null}
          {status === 'window_open' ? (
            <Button
              kind="primary"
              label="End window and measure"
              busy={end.isPending}
              onPress={() => end.mutate(undefined)}
            />
          ) : null}
          {status === 'settling' && hasSimulated && deliver.isError ? (
            // The window ended but the simulated readings did not arrive. Sending them
            // again is safe: a household keeps one reading per kind.
            <Button
              label="Resend simulated readings"
              busy={deliver.isPending}
              onPress={() => deliver.mutate(undefined)}
            />
          ) : null}
          {status === 'settling' ? (
            <Button
              kind="primary"
              label="Settle results"
              busy={settle.isPending}
              disabled={deliver.isPending}
              onPress={() => settle.mutate(undefined)}
            />
          ) : null}
        </View>
      </View>

      <Txt size="xs" tone="muted">
        {committing && current === 0
          ? 'Simulated households are still committing; the window can open when they finish.'
          : hint(status)}{' '}
        Demo control: the window is moved to now, its scheduled length is kept.
      </Txt>
      {failed ? <Notice tone="critical">{errorMessage(failed)}</Notice> : null}
    </View>
  );
}

function hint(status: AlertStatus): string {
  switch (status) {
    case 'scheduled':
    case 'active':
      return 'Households can commit until the window opens.';
    case 'window_open':
      return 'Commits are closed. Photo households take the before photo now.';
    case 'settling':
      return 'Window ended. After photos are due; delivered load fills as readings pass their checks.';
    case 'settled':
      return 'Results are final. Credits, points and barangay bonuses have been issued.';
    case 'cancelled':
      return 'This alert was cancelled.';
  }
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
  actions: { flexDirection: 'row', gap: space.sm },
});
