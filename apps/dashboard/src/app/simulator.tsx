import type { SimParams } from '@kapitwatt/shared';
import { DEFAULT_PARAMS, PRESETS, expectedOutcome, type PresetName } from '@kapitwatt/sim';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Field, Segmented, Slider, TextField } from '@/components/form';
import { Skeleton } from '@kapitwatt/ui';
import { Button, Card, Label, Notice, PageHeader, Tag, Txt } from '@/components/ui';
import { client, errorMessage } from '@/lib/client';
import { count, fraction, kw, percent } from '@/lib/format';
import {
  SIM_COMMIT_RUN,
  useAction,
  useCurrentAlert,
  useDemoControls,
  useSimStatus,
  useTotals,
} from '@/lib/queries';
import { useSimParams } from '@/lib/sim-params';
import { colors, space } from '@/theme';

const PRESET_OPTIONS: { value: PresetName; label: string }[] = [
  { value: 'poor', label: `Poor ${fraction(PRESETS.poor.participation)}` },
  { value: 'typical', label: `Typical ${fraction(PRESETS.typical.participation)}` },
  { value: 'best', label: `Best ${fraction(PRESETS.best.participation)}` },
];

const pct = (value: number) => fraction(value);

export default function SimulatorScreen() {
  const { params, setParams } = useSimParams();
  const status = useSimStatus();
  const alert = useCurrentAlert();
  const totals = useTotals(alert.data?.id);
  const [confirmReset, setConfirmReset] = useState(false);

  const seed = useAction(() => client.simSeed({ amiShare: params.amiShare, seed: params.seed }));
  const run = useAction(
    (alertId: string) => client.simRun(alertId, params, 'commit'),
    SIM_COMMIT_RUN,
  );
  const reset = useAction(() => client.simReset());

  const set = (patch: Partial<SimParams>) => setParams({ ...params, ...patch });
  const preset =
    (Object.keys(PRESETS) as PresetName[]).find(
      (name) => PRESETS[name].participation === params.participation,
    ) ?? null;

  const demo = useDemoControls();
  const households = status.data?.simulatedHouseholds ?? 0;
  const alertStatus = totals.data?.status ?? alert.data?.status;
  const canRun = demo && Boolean(alert.data) && alertStatus === 'active' && households > 0;
  const targetKw = alert.data?.targetKw;
  // An alert may target only some barangays; the run only reaches households there.
  const targeted = totals.data?.barangays.some((b) => b.households !== undefined)
    ? totals.data.barangays.reduce((sum, b) => sum + (b.households ?? 0), 0)
    : households;
  const expected = expectedOutcome(alert.data ? targeted : households, params);
  const failed = demo ? (status.error ?? seed.error ?? run.error ?? reset.error) : null;
  const lastRun = run.data ?? null;

  return (
    <>
      <PageHeader
        title="Simulator"
        subtitle="Demo only. Runs simulated households through the same commit, reading and settlement code as real phones."
        actions={<Tag label="Every value here is an assumption" tone="brand" />}
      />

      {failed ? <Notice tone="critical">{errorMessage(failed)}</Notice> : null}
      {demo ? null : (
        <Notice tone="warning">
          The simulator is off: this API is not running in the demo environment, so seed, run and
          reset are not available.
        </Notice>
      )}

      <View style={styles.columns}>
        <View style={styles.left}>
          <Card
            title="Parameters"
            aside={
              <Button
                small
                kind="ghost"
                label="Reset to plan defaults"
                onPress={() => setParams(DEFAULT_PARAMS)}
              />
            }
          >
            <View style={{ gap: space.lg }}>
              <Field label="Participation preset">
                <Segmented
                  label="Participation preset"
                  value={preset}
                  options={PRESET_OPTIONS}
                  onChange={(name) => set({ participation: PRESETS[name].participation })}
                />
              </Field>

              <View style={styles.grid}>
                <View style={styles.gridItem}>
                  <Slider
                    label="Participation"
                    hint="Share of households that commit."
                    value={params.participation}
                    min={0.2}
                    max={0.8}
                    step={0.05}
                    format={pct}
                    onChange={(participation) => set({ participation })}
                  />
                </View>
                <View style={styles.gridItem}>
                  <Slider
                    label="Follow-through, smart meter"
                    hint="Share of the committed cut smart-meter households deliver."
                    value={params.followThrough}
                    min={0}
                    max={1}
                    step={0.05}
                    format={pct}
                    // Until the photo slider is moved, both paths follow this one.
                    onChange={(followThrough) => set({ followThrough })}
                  />
                </View>
                <View style={styles.gridItem}>
                  <Slider
                    label="Follow-through, meter photo"
                    hint={
                      params.photoFollowThrough === undefined
                        ? 'Same as smart meter until you move it.'
                        : 'Share of the committed cut photo households deliver.'
                    }
                    value={params.photoFollowThrough ?? params.followThrough}
                    min={0}
                    max={1}
                    step={0.05}
                    format={pct}
                    onChange={(photoFollowThrough) => set({ photoFollowThrough })}
                  />
                </View>
                <View style={styles.gridItem}>
                  <Slider
                    label="Smart-meter share"
                    hint={`The rest (${pct(1 - params.amiShare)}) verify by meter photo. Applied when you seed.`}
                    value={params.amiShare}
                    min={0}
                    max={1}
                    step={0.05}
                    format={pct}
                    onChange={(amiShare) => set({ amiShare })}
                  />
                </View>
                <View style={styles.gridItem}>
                  <Slider
                    label="Photo completion"
                    hint="Photo households that send both photos on time."
                    value={params.photoCompletion}
                    min={0}
                    max={1}
                    step={0.05}
                    format={pct}
                    onChange={(photoCompletion) => set({ photoCompletion })}
                  />
                </View>
                <View style={styles.gridItem}>
                  <Slider
                    label="Baseline noise"
                    hint="How far a household's real load strays from its baseline."
                    value={params.baselineNoise}
                    min={0}
                    max={0.3}
                    step={0.01}
                    format={(v) => `±${pct(v)}`}
                    onChange={(baselineNoise) => set({ baselineNoise })}
                  />
                </View>
                <View style={styles.gridItem}>
                  <Slider
                    label="Spread between barangays"
                    hint="Variation in participation, so some barangays reach target."
                    value={params.barangaySpread}
                    min={0}
                    max={0.5}
                    step={0.05}
                    format={(v) => `±${pct(v)}`}
                    onChange={(barangaySpread) => set({ barangaySpread })}
                  />
                </View>
                <View style={styles.gridItem}>
                  <Slider
                    label="Cut per household"
                    value={params.cutKw}
                    min={0.5}
                    max={2}
                    step={0.5}
                    format={(v) => `${v} kW`}
                    onChange={(cutKw) => set({ cutKw })}
                  />
                </View>
                <View style={styles.gridItem}>
                  <Slider
                    label="Commit pacing"
                    hint="Commits arrive over this long."
                    value={params.paceSeconds}
                    min={0}
                    max={60}
                    step={5}
                    format={(v) => `${v} s`}
                    onChange={(paceSeconds) => set({ paceSeconds })}
                  />
                </View>
              </View>

              <Field label="Random seed" hint="The same seed gives the same run.">
                <TextField
                  label="Random seed"
                  numeric
                  width={96}
                  value={String(params.seed)}
                  onChangeText={(text) => set({ seed: Number(text.replace(/\D/g, '')) || 0 })}
                />
              </Field>
            </View>
          </Card>
        </View>

        <View style={styles.right}>
          <Card title="Run">
            <View style={{ gap: space.md }}>
              <View style={styles.actionRow}>
                <View style={{ flex: 1 }}>
                  <Txt tone="ink" weight="600">
                    1. Seed Laguna
                  </Txt>
                  <Txt size="sm" tone="muted">
                    Creates the simulated households in the 21 pilot barangays.
                  </Txt>
                </View>
                <Button
                  label={households > 0 ? 'Re-seed' : 'Seed'}
                  kind={households > 0 ? 'secondary' : 'primary'}
                  busy={seed.isPending}
                  disabled={!demo}
                  onPress={() => seed.mutate(undefined)}
                />
              </View>
              <View style={styles.rule} />
              <View style={styles.actionRow}>
                <View style={{ flex: 1 }}>
                  <Txt tone="ink" weight="600">
                    2. Run event
                  </Txt>
                  <Txt size="sm" tone="muted">
                    {canRun
                      ? `Simulated households commit over about ${params.paceSeconds} s.`
                      : !alert.data
                        ? 'Send an alert first.'
                        : households === 0
                          ? 'Seed households first.'
                          : 'Commits are closed: the window has opened.'}
                  </Txt>
                </View>
                <Button
                  kind="primary"
                  label="Run event"
                  disabled={!canRun}
                  busy={run.isPending}
                  onPress={() => alert.data && run.mutate(alert.data.id)}
                />
              </View>
              <Txt size="xs" tone="muted">
                Meter readings follow when you end the window on the Live load page.
              </Txt>
              <View style={styles.rule} />
              <View style={styles.actionRow}>
                <View style={{ flex: 1 }}>
                  <Txt tone="ink" weight="600">
                    Reset
                  </Txt>
                  <Txt size="sm" tone="muted">
                    Deletes simulated households and their data only. Real households stay.
                  </Txt>
                </View>
                {confirmReset ? (
                  <View style={{ flexDirection: 'row', gap: space.sm }}>
                    <Button label="Keep" onPress={() => setConfirmReset(false)} />
                    <Button
                      kind="danger"
                      label="Delete simulated data"
                      busy={reset.isPending}
                      onPress={() =>
                        reset.mutate(undefined, { onSettled: () => setConfirmReset(false) })
                      }
                    />
                  </View>
                ) : (
                  <Button label="Reset" disabled={!demo} onPress={() => setConfirmReset(true)} />
                )}
              </View>
            </View>
          </Card>

          <Card title="Simulated households">
            <View style={styles.figures}>
              <Figure
                loading={status.isLoading}
                label="Households"
                value={status.data ? count(households) : '—'}
              />
              <Figure
                loading={status.isLoading}
                label="Smart meter"
                value={status.data ? count(status.data.amiHouseholds) : '—'}
              />
              <Figure
                loading={status.isLoading}
                label="Meter photo"
                value={status.data ? count(status.data.photoHouseholds) : '—'}
              />
            </View>
            {lastRun ? (
              <Txt size="sm" tone="muted" numeric style={{ marginTop: space.md }}>
                Last run ({lastRun.phase === 'commit' ? 'commits' : 'readings'}):{' '}
                {count(lastRun.committed)} of {count(lastRun.households)} households committed{' '}
                {kw(lastRun.committedKw)} kW
                {lastRun.phase === 'deliver'
                  ? `; ${count(lastRun.householdsWithReadings)} sent readings`
                  : ''}
                .
              </Txt>
            ) : null}
          </Card>

          <Card title="Expected with these parameters">
            <View style={{ gap: space.sm }}>
              <ExpectedRow
                label="Committed"
                value={expected.committedKw}
                target={targetKw}
                color={colors.series.committed}
              />
              <ExpectedRow
                label="Delivered, smart meter"
                value={expected.deliveredAmiKw}
                color={colors.series.deliveredAmi}
              />
              <ExpectedRow
                label="Delivered, meter photo"
                value={expected.deliveredPhotoKw}
                color={colors.series.deliveredPhoto}
              />
              <View style={styles.rule} />
              <ExpectedRow
                label="Delivered, total"
                value={expected.deliveredKw}
                target={targetKw}
              />
              <Txt size="xs" tone="muted">
                Arithmetic only, for {count(alert.data ? targeted : households)} households
                {alert.data ? ' in the targeted barangays' : ''}: households × participation × cut,
                then follow-through per path and photo completion. A real run lands near these
                figures, not on them.
                {targetKw === undefined ? ' Send an alert to compare against its target.' : ''}
              </Txt>
            </View>
          </Card>
        </View>
      </View>
    </>
  );
}

function Figure({ label, value, loading }: { label: string; value: string; loading?: boolean }) {
  return (
    <View style={{ minWidth: 96, gap: 2 }}>
      <Label>{label}</Label>
      {loading ? (
        <Skeleton width={72} height={22} radius="sm" style={{ marginVertical: 2 }} />
      ) : (
        <Txt size="xl" tone="ink" weight="600" numeric>
          {value}
        </Txt>
      )}
    </View>
  );
}

function ExpectedRow({
  label,
  value,
  target,
  color,
}: {
  label: string;
  value: number;
  target?: number;
  color?: string;
}) {
  return (
    <View style={styles.expectedRow}>
      <View style={[styles.swatch, { backgroundColor: color ?? 'transparent' }]} />
      <Txt size="sm" style={{ flex: 1 }}>
        {label}
      </Txt>
      {target !== undefined ? (
        <Txt size="sm" tone="muted" numeric>
          {percent(value, target)} of target
        </Txt>
      ) : null}
      <Txt size="sm" tone="ink" weight="600" numeric style={{ width: 72, textAlign: 'right' }}>
        {kw(Math.round(value))} kW
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  columns: { flexDirection: 'row', gap: space.lg, flexWrap: 'wrap', alignItems: 'flex-start' },
  left: { flexGrow: 3, flexBasis: 520, minWidth: 0 },
  right: { flexGrow: 2, flexBasis: 360, gap: space.lg, minWidth: 0 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: space.xl, rowGap: space.lg },
  gridItem: { flexGrow: 1, flexBasis: 220, minWidth: 0 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  rule: { height: 1, backgroundColor: colors.border },
  figures: { flexDirection: 'row', flexWrap: 'wrap', gap: space.lg },
  expectedRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 22 },
  swatch: { width: 10, height: 10, borderRadius: 2 },
});
