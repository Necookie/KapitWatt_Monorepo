import {
  CreateAlertInput,
  DEFAULT_WINDOW_HOURS,
  PILOT_TOWNS,
  type AlertLevel,
  type BarangayWithCount,
} from '@kapitwatt/shared';
import { useRouter } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import {
  Checkbox,
  DateTimeField,
  Field,
  Segmented,
  TextField,
  toLocalInput,
} from '@/components/form';
import { Skeleton } from '@kapitwatt/ui';
import { Button, Card, Label, Notice, PageHeader, Tag, Txt } from '@/components/ui';
import { client, errorMessage } from '@/lib/client';
import { about, clock, dayAndClock, power } from '@/lib/format';
import { useAction, useBarangays, useCurrentAlert } from '@/lib/queries';
import { colors, radius, space } from '@/theme';

/** Form defaults only: a red alert asks for a bigger cut than a yellow one (FR-DASH-01). */
const DEFAULT_TARGET_KW: Record<AlertLevel, number> = { yellow: 300, red: 600 };
/** The operator can type the target in either unit (PRD: "kW or MW of relief wanted"). */
type TargetUnit = 'kW' | 'MW';
const KW_PER: Record<TargetUnit, number> = { kW: 1, MW: 1000 };
const UNITS = (Object.keys(KW_PER) as TargetUnit[]).map((unit) => ({ value: unit, label: unit }));
/** Keeps 0.6 MW at 600 kW rather than 600.0000000001. */
const toKw = (value: number, unit: TargetUnit) => Math.round(value * KW_PER[unit] * 100) / 100;

const DURATIONS = [1, DEFAULT_WINDOW_HOURS, 3].map((h) => ({ value: h, label: `${h} h` }));

function tonightAt(hour: number): Date {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  if (date.getTime() <= Date.now()) date.setDate(date.getDate() + 1);
  return date;
}

function inMinutes(minutes: number): Date {
  const date = new Date(Date.now() + minutes * 60_000);
  date.setSeconds(0, 0);
  return date;
}

function defaultMessage(level: AlertLevel, start: Date, end: Date): string {
  const window = `${clock(start.toISOString())} to ${clock(end.toISOString())}`;
  return level === 'red'
    ? `Red alert on the Luzon grid. Brownouts are possible. Please cut your load from ${window}. Open KapitWatt to commit a cut and earn bill credit.`
    : `Yellow alert on the Luzon grid. Supply is tight. Please cut your load from ${window} if you can. Open KapitWatt to commit a cut and earn bill credit.`;
}

export default function NewAlertScreen() {
  const router = useRouter();
  const barangays = useBarangays();
  const current = useCurrentAlert();

  const [level, setLevel] = useState<AlertLevel>('red');
  const [start, setStart] = useState(() => toLocalInput(tonightAt(18)));
  const [hours, setHours] = useState<number>(DEFAULT_WINDOW_HOURS);
  const [target, setTarget] = useState<string | null>(null);
  const [unit, setUnit] = useState<TargetUnit>('kW');
  const [message, setMessage] = useState<string | null>(null);
  /** Null means all pilot areas. */
  const [picked, setPicked] = useState<Set<string> | null>(null);
  const [confirming, setConfirming] = useState(false);

  const all = barangays.data ?? [];
  const selected = picked ?? new Set(all.map((b) => b.id));
  const everything = all.length > 0 && selected.size === all.length;

  const startDate = new Date(start);
  const validStart = !Number.isNaN(startDate.getTime());
  const endDate = new Date((validStart ? startDate.getTime() : Date.now()) + hours * 3_600_000);
  const targetText = target ?? String(DEFAULT_TARGET_KW[level] / KW_PER[unit]);
  const changeUnit = (next: TargetUnit) => {
    // Keep the amount, change how it is written: 600 kW becomes 0.6 MW.
    if (target !== null && target !== '') {
      setTarget(String(toKw(Number(target), unit) / KW_PER[next]));
    }
    setUnit(next);
  };
  const messageText =
    message ?? defaultMessage(level, validStart ? startDate : new Date(), endDate);

  const byTown = useMemo(() => {
    const groups = new Map<string, BarangayWithCount[]>();
    for (const town of PILOT_TOWNS) groups.set(town, []);
    for (const b of all) {
      const group = groups.get(b.municipality);
      if (group) group.push(b);
      else groups.set(b.municipality, [b]);
    }
    return [...groups].filter(([, list]) => list.length > 0);
  }, [all]);

  const chosen = all.filter((b) => selected.has(b.id));
  const townCount = new Set(chosen.map((b) => b.municipality)).size;
  const knowsHouseholds = chosen.some((b) => b.optedInHouseholds !== undefined);
  const households = chosen.reduce((sum, b) => sum + (b.optedInHouseholds ?? 0), 0);

  const input = {
    level,
    windowStart: validStart ? startDate.toISOString() : '',
    windowEnd: endDate.toISOString(),
    targetKw: toKw(Number(targetText), unit),
    // An empty list is the API's way of saying "all pilot areas".
    targetBarangayIds: everything ? [] : chosen.map((b) => b.id),
    message: messageText.trim(),
  };
  const parsed = CreateAlertInput.safeParse(input);
  const problem = !validStart
    ? 'Enter a start time.'
    : chosen.length === 0
      ? 'Pick at least one barangay.'
      : !(input.targetKw > 0)
        ? `Enter a target above 0 ${unit}.`
        : input.message.length === 0
          ? 'The message cannot be empty.'
          : parsed.success
            ? null
            : 'Check the form values.';

  const send = useAction(() => client.createAlert(CreateAlertInput.parse(input)));
  const inForce = current.data && current.data.status !== 'settled' ? current.data : null;

  const toggle = (ids: string[], on: boolean) => {
    const next = new Set(selected);
    for (const id of ids) {
      if (on) next.add(id);
      else next.delete(id);
    }
    setPicked(next);
  };

  const levelName = level === 'red' ? 'red' : 'yellow';
  const reach = `${townCount} ${townCount === 1 ? 'town' : 'towns'}${
    knowsHouseholds ? `, ${about(households)} households` : ''
  }`;

  return (
    <>
      <PageHeader
        title="Send alert"
        subtitle="Ask opted-in households in the Laguna pilot to cut load during a peak window."
      />

      {inForce ? (
        <Notice tone="warning">
          An alert is already in force ({inForce.level}, {dayAndClock(inForce.windowStart)}).
          Sending another starts a new event; the live view follows the newest one.
        </Notice>
      ) : null}
      {barangays.error ? <Notice tone="critical">{errorMessage(barangays.error)}</Notice> : null}

      <View style={styles.columns}>
        <View style={styles.formColumn}>
          <Card title="Alert">
            <View style={{ gap: space.lg }}>
              <Field label="Level" hint="Red can ask for a bigger cut than yellow.">
                <Segmented
                  label="Alert level"
                  value={level}
                  onChange={setLevel}
                  options={[
                    { value: 'yellow', label: 'Yellow' },
                    { value: 'red', label: 'Red' },
                  ]}
                />
              </Field>

              <Field
                label="Peak window"
                hint={
                  validStart
                    ? `${dayAndClock(startDate.toISOString())} to ${clock(endDate.toISOString())}`
                    : undefined
                }
              >
                <View style={styles.inline}>
                  <DateTimeField label="Window start" value={start} onChange={setStart} />
                  <Segmented
                    label="Window length"
                    value={hours}
                    onChange={setHours}
                    options={DURATIONS}
                  />
                </View>
                <View style={styles.inline}>
                  <Button
                    small
                    label="Tonight 6 PM"
                    onPress={() => setStart(toLocalInput(tonightAt(18)))}
                  />
                  <Button
                    small
                    label="In 10 minutes"
                    onPress={() => setStart(toLocalInput(inMinutes(10)))}
                  />
                  <Button
                    small
                    label="In 1 hour"
                    onPress={() => setStart(toLocalInput(inMinutes(60)))}
                  />
                </View>
              </Field>

              <Field
                label="Target relief"
                hint="Split across the targeted barangays by opted-in households."
              >
                <View style={styles.inline}>
                  <TextField
                    label={`Target in ${unit}`}
                    numeric
                    width={96}
                    value={targetText}
                    onChangeText={(text) => setTarget(text.replace(/[^0-9.]/g, ''))}
                  />
                  <Segmented
                    label="Target unit"
                    value={unit}
                    onChange={changeUnit}
                    options={UNITS}
                  />
                </View>
              </Field>

              <Field label="Message to households">
                <TextField
                  label="Message to households"
                  multiline
                  value={messageText}
                  onChangeText={setMessage}
                />
                {message !== null ? (
                  <View style={styles.inline}>
                    <Button
                      small
                      kind="ghost"
                      label="Reset to default"
                      onPress={() => setMessage(null)}
                    />
                  </View>
                ) : null}
              </Field>
            </View>
          </Card>

          <Card
            title="Target areas"
            aside={
              <Txt size="sm" tone="muted" numeric>
                {chosen.length} of {all.length} barangays
              </Txt>
            }
          >
            <View style={{ gap: space.md }}>
              <Checkbox
                strong
                label="All pilot areas"
                checked={everything}
                mixed={!everything && chosen.length > 0}
                onChange={(on) => setPicked(on ? null : new Set())}
              />
              <View style={styles.towns}>
                {byTown.map(([town, list]) => {
                  const on = list.filter((b) => selected.has(b.id)).length;
                  return (
                    <View key={town} style={styles.town}>
                      <Checkbox
                        strong
                        label={town}
                        checked={on === list.length}
                        mixed={on > 0 && on < list.length}
                        onChange={(next) =>
                          toggle(
                            list.map((b) => b.id),
                            next,
                          )
                        }
                      />
                      <View style={{ paddingLeft: 22 }}>
                        {list.map((b) => (
                          <Checkbox
                            key={b.id}
                            label={b.name}
                            checked={selected.has(b.id)}
                            onChange={(next) => toggle([b.id], next)}
                          />
                        ))}
                      </View>
                    </View>
                  );
                })}
              </View>
              {all.length === 0 && barangays.isLoading ? (
                // One group per pilot town, three barangay checkboxes each, while the list loads.
                <View accessibilityLabel="Loading barangays" style={{ gap: space.lg }}>
                  {[0, 1, 2].map((g) => (
                    <View key={g} style={{ gap: space.sm }}>
                      <Skeleton width={110} height={12} />
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
                        {[0, 1, 2].map((i) => (
                          <Skeleton
                            key={i}
                            width={[120, 96, 140][(g + i) % 3]}
                            height={20}
                            radius="sm"
                          />
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              ) : all.length === 0 ? (
                <Txt size="sm" tone="muted">
                  No barangays returned by the API.
                </Txt>
              ) : null}
            </View>
          </Card>
        </View>

        <View style={styles.previewColumn}>
          <Card title="Message preview">
            <View style={{ gap: space.md }}>
              <View style={styles.push}>
                <View style={styles.pushHead}>
                  <View style={styles.pushIcon} />
                  <Txt size="xs" tone="muted" weight="600">
                    KAPITWATT · now
                  </Txt>
                </View>
                <Txt tone="ink" weight="600">
                  {level === 'red' ? 'Red alert' : 'Yellow alert'}: cut load{' '}
                  {validStart ? clock(startDate.toISOString()) : ''} to{' '}
                  {clock(endDate.toISOString())}
                </Txt>
                <Txt size="sm">{messageText}</Txt>
              </View>
              <Txt size="xs" tone="muted">
                Push goes only to opted-in phones in the targeted barangays. Simulated households
                receive nothing. SMS is mocked.
              </Txt>
            </View>
          </Card>

          <Card title="Summary">
            <View style={{ gap: space.sm }}>
              <SummaryRow label="Level">
                <Tag
                  label={level === 'red' ? 'Red alert' : 'Yellow alert'}
                  tone={level === 'red' ? 'critical' : 'warning'}
                />
              </SummaryRow>
              <SummaryRow label="Window">
                <Txt tone="ink" numeric>
                  {validStart ? dayAndClock(startDate.toISOString()) : '—'} to{' '}
                  {clock(endDate.toISOString())} ({hours} h)
                </Txt>
              </SummaryRow>
              <SummaryRow label="Reach">
                <Txt tone="ink" numeric>
                  {reach}
                </Txt>
              </SummaryRow>
              <SummaryRow label="Target">
                <Txt tone="ink" numeric>
                  {input.targetKw > 0 ? power(input.targetKw) : '—'}
                </Txt>
              </SummaryRow>
              {problem ? <Notice tone="warning">{problem}</Notice> : null}
              <Button
                kind="primary"
                label="Review and send"
                disabled={problem !== null}
                onPress={() => setConfirming(true)}
              />
              <Txt size="xs" tone="muted">
                The NGCP alert is simulated: the operator plays Meralco. Every alert is logged with
                sender and time.
              </Txt>
            </View>
          </Card>
        </View>
      </View>

      <Modal transparent visible={confirming} onRequestClose={() => setConfirming(false)}>
        <View style={styles.backdrop}>
          <View style={styles.dialog} accessibilityRole="alert">
            <Txt size="lg" tone="ink" weight="600">
              Send {levelName} alert to {reach}?
            </Txt>
            <Txt size="sm" tone="muted" numeric>
              Peak window {validStart ? dayAndClock(startDate.toISOString()) : ''} to{' '}
              {clock(endDate.toISOString())}. Target {power(input.targetKw || 0)}. Opted-in phones
              in these barangays are notified straight away.
            </Txt>
            {send.error ? <Notice tone="critical">{errorMessage(send.error)}</Notice> : null}
            <View style={styles.dialogActions}>
              <Button
                label="Cancel"
                disabled={send.isPending}
                onPress={() => {
                  send.reset();
                  setConfirming(false);
                }}
              />
              <Button
                kind={level === 'red' ? 'danger' : 'primary'}
                label={`Send ${levelName} alert`}
                busy={send.isPending}
                onPress={() =>
                  send.mutate(undefined, {
                    onSuccess: () => {
                      setConfirming(false);
                      router.replace('/');
                    },
                  })
                }
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function SummaryRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.summaryRow}>
      <Label style={{ width: 64 }}>{label}</Label>
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  columns: { flexDirection: 'row', gap: space.lg, flexWrap: 'wrap', alignItems: 'flex-start' },
  formColumn: { flexGrow: 3, flexBasis: 520, gap: space.lg, minWidth: 0 },
  previewColumn: { flexGrow: 2, flexBasis: 320, gap: space.lg, minWidth: 0 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' },
  towns: { flexDirection: 'row', flexWrap: 'wrap', columnGap: space.xl, rowGap: space.md },
  town: { width: 168 },
  push: {
    gap: 4,
    padding: space.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  pushHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pushIcon: { width: 12, height: 12, borderRadius: 3, backgroundColor: colors.brand },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 24 },
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xl,
    backgroundColor: 'rgba(31, 26, 21, 0.45)',
  },
  dialog: {
    width: '100%',
    maxWidth: 440,
    gap: space.md,
    padding: space.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  dialogActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: space.sm },
});
