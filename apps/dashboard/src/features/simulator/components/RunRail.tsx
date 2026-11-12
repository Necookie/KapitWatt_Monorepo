import type { SimRunSummary } from '@kapitwatt/shared';
import { useTheme } from '@kapitwatt/hooks';
import { Icon } from '@kapitwatt/icons';
import { Button, Text } from '@kapitwatt/ui';
import { useState } from 'react';
import { View } from 'react-native';
import { count, kw } from '@/utils/format';
import { RunProgress } from './RunProgress';
import { Step, type StepState } from './Step';

/**
 * Run the demo: seed, run, measure, as a tracker with the next step as the one main button and the
 * reason when a step cannot run yet. Reset sits apart, asked twice.
 */
export function RunRail({
  enabled,
  seeded,
  hasAlert,
  canRun,
  committed,
  committedKw,
  expectedKw,
  paceSeconds,
  lastRun,
  seeding,
  running,
  resetting,
  onSeed,
  onRun,
  onReset,
  onSendAlert,
  onOpenLive,
  between,
}: {
  enabled: boolean;
  seeded: number;
  hasAlert: boolean;
  canRun: boolean;
  /** Simulated commits are in: the event can be measured. */
  committed: boolean;
  /** Committed so far, and what the run is expected to commit (for its progress). */
  committedKw: number;
  expectedKw: number;
  paceSeconds: number;
  lastRun: SimRunSummary | null;
  seeding: boolean;
  running: boolean;
  resetting: boolean;
  onSeed: () => void;
  onRun: () => void;
  onReset: () => void;
  onSendAlert: () => void;
  onOpenLive: () => void;
  /** Drawn between the steps and the reset (the expected outcome, on wide screens). */
  between?: React.ReactNode;
}) {
  const t = useTheme();
  const c = t.color;
  const [confirm, setConfirm] = useState(false);

  const seedState: StepState = seeded > 0 ? 'done' : 'now';
  const runState: StepState = seeded === 0 ? 'todo' : committed ? 'done' : 'now';
  const measureState: StepState = committed ? 'now' : 'todo';
  const runNote = !hasAlert
    ? 'Needs an alert: send one first.'
    : seeded === 0
      ? 'Seed households first.'
      : committed
        ? 'Simulated households have committed.'
        : canRun
          ? `Households commit over about ${paceSeconds} s.`
          : 'Commits are closed: the window has opened.';

  const next =
    seeded === 0 ? (
      <Button
        label="Seed Laguna"
        size="lg"
        fullWidth
        loading={seeding}
        disabled={!enabled}
        onPress={onSeed}
      />
    ) : !hasAlert ? (
      <Button
        label="Send an alert"
        size="lg"
        fullWidth
        icon={<Icon name="send" size="sm" color="onPrimary" />}
        onPress={onSendAlert}
      />
    ) : canRun && !committed ? (
      <Button
        label="Run event"
        size="lg"
        fullWidth
        loading={running}
        disabled={!enabled}
        onPress={onRun}
      />
    ) : (
      <Button
        label="Measure on Live load"
        size="lg"
        fullWidth
        icon={<Icon name="chartLine" size="sm" color="onPrimary" />}
        onPress={onOpenLive}
      />
    );

  return (
    <View style={{ gap: t.space[4] }}>
      <View
        style={{
          gap: t.space[4],
          padding: t.space[5],
          borderRadius: t.radius.lg,
          backgroundColor: c.surfaceContainerLowest,
          borderWidth: t.borderWidth.hairline,
          borderColor: c.outlineVariant,
        }}
      >
        <Text variant="titleMedium">Run the demo</Text>
        <Step
          n={1}
          title="Seed Laguna"
          note={
            seeded > 0
              ? `${count(seeded)} households in the 21 pilot barangays.`
              : 'Creates simulated households in the 21 pilot barangays.'
          }
          state={seedState}
          action={
            seeded > 0 ? (
              <Button
                label="Re-seed"
                variant="text"
                loading={seeding}
                disabled={!enabled}
                onPress={onSeed}
              />
            ) : undefined
          }
        />
        <Step n={2} title="Run event" note={runNote} state={runState} />
        {running ? <RunProgress committedKw={committedKw} expectedKw={expectedKw} /> : null}
        <Step
          n={3}
          title="Measure on Live load"
          note="End the window there: readings arrive and the event settles."
          state={measureState}
        />
        {next}
        {lastRun ? (
          <Text
            variant="bodySmall"
            color="onSurfaceVariant"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            Last run: {count(lastRun.committed)} of {count(lastRun.households)} households committed{' '}
            {kw(lastRun.committedKw)} kW
            {lastRun.phase === 'deliver'
              ? `; ${count(lastRun.householdsWithReadings)} sent readings`
              : ''}
            .
          </Text>
        ) : null}
      </View>

      {between}

      <View
        style={{
          gap: t.space[2],
          padding: t.space[4],
          borderRadius: t.radius.lg,
          borderWidth: t.borderWidth.hairline,
          borderColor: c.outlineVariant,
        }}
      >
        <Text variant="bodySmall" color="onSurfaceVariant">
          Reset deletes simulated households and their data only. Real households stay.
        </Text>
        {confirm ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space[2] }}>
            <Button label="Keep" variant="text" onPress={() => setConfirm(false)} />
            <Button
              label="Delete simulated data"
              variant="tonal"
              loading={resetting}
              icon={<Icon name="close" size="sm" color="onSecondaryContainer" />}
              onPress={() => {
                onReset();
                setConfirm(false);
              }}
            />
          </View>
        ) : (
          <View style={{ alignItems: 'flex-start' }}>
            <Button
              label="Reset simulated data"
              variant="outlined"
              disabled={!enabled}
              onPress={() => setConfirm(true)}
            />
          </View>
        )}
      </View>
    </View>
  );
}
