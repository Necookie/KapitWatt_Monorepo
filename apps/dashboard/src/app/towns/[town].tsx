import type { BarangayTotals } from '@kapitwatt/shared';
import { Link, useLocalSearchParams } from 'expo-router';
import { UpdateTargetsInput } from '@kapitwatt/shared';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { TargetMeter } from '@/components/charts';
import { DataTable, type Column } from '@/components/DataTable';
import { TextField } from '@/components/form';
import { Button, Card, Notice, PageHeader, Stat, Tag, Txt } from '@/components/ui';
import { client, errorMessage } from '@/lib/client';
import { byTown, count, kw, percent } from '@/lib/format';
import { useAction, useCurrentAlert, useTotals } from '@/lib/queries';
import { colors } from '@/theme';

export default function TownScreen() {
  const { town: param } = useLocalSearchParams<{ town: string }>();
  const name = Array.isArray(param) ? param[0] : param;
  const alert = useCurrentAlert();
  const totals = useTotals(alert.data?.id);

  const town = byTown(totals.data).find((t) => t.town === name);
  const status = totals.data?.status ?? alert.data?.status;
  const measured = status === 'settling' || status === 'settled';
  const failed = alert.error ?? totals.error;

  // Operator override of barangay shares (PRD: "the operator can override a barangay's
  // share"). The API accepts it until the window has ended.
  const editable = status === 'scheduled' || status === 'active' || status === 'window_open';
  /** Typed targets by barangay id while editing; null when not editing. */
  const [draft, setDraft] = useState<Record<string, string> | null>(null);
  const typed = (b: BarangayTotals) => draft?.[b.barangayId] ?? String(b.targetKw);
  const changed = (town?.barangays ?? []).filter(
    (b) => draft?.[b.barangayId] !== undefined && Number(typed(b)) !== b.targetKw,
  );
  const wanted = changed.map((b) => ({ barangayId: b.barangayId, targetKw: Number(typed(b)) }));
  // The same limits the API applies, so Save never sends a request that must fail.
  const invalid =
    changed.some((b) => typed(b).trim() === '') ||
    (wanted.length > 0 && !UpdateTargetsInput.safeParse({ targets: wanted }).success);
  // A draft belongs to one alert: typed targets must never be saved against the next one.
  const alertId = alert.data?.id;
  useEffect(() => setDraft(null), [alertId]);
  const save = useAction(() => client.updateTargets(alert.data!.id, wanted));
  const stopEditing = () => {
    save.reset();
    setDraft(null);
  };
  // What the barangay targets would add up to across the whole alert, with the edits applied.
  const allTargets = (totals.data?.barangays ?? []).reduce(
    (sum, b) => sum + (draft?.[b.barangayId] !== undefined ? Number(typed(b)) || 0 : b.targetKw),
    0,
  );

  const columns: Column<BarangayTotals>[] = [
    {
      key: 'name',
      header: 'Barangay',
      flex: 1.4,
      render: (b) => (
        <Txt tone="ink" weight="600">
          {b.name}
        </Txt>
      ),
    },
    {
      key: 'households',
      header: 'Households',
      width: 100,
      align: 'right',
      render: (b) => <Txt numeric>{b.households !== undefined ? count(b.households) : '—'}</Txt>,
    },
    {
      key: 'committedHouseholds',
      header: 'Committed',
      width: 90,
      align: 'right',
      render: (b) => (
        <Txt numeric>
          {b.committedHouseholds !== undefined ? count(b.committedHouseholds) : '—'}
        </Txt>
      ),
    },
    {
      key: 'target',
      header: 'Target kW',
      width: 90,
      align: 'right',
      render: (b) =>
        draft ? (
          <TextField
            label={`Target kW for ${b.name}`}
            numeric
            width={72}
            value={typed(b)}
            onChangeText={(text) =>
              setDraft({ ...draft, [b.barangayId]: text.replace(/[^0-9.]/g, '') })
            }
          />
        ) : (
          <Txt numeric>{kw(b.targetKw)}</Txt>
        ),
    },
    {
      key: 'committed',
      header: 'Committed kW',
      width: 110,
      align: 'right',
      render: (b) => <Txt numeric>{kw(b.committedKw)}</Txt>,
    },
    {
      key: 'delivered',
      header: 'Delivered kW',
      width: 110,
      align: 'right',
      render: (b) => <Txt numeric>{measured ? kw(b.deliveredKw) : '—'}</Txt>,
    },
    {
      key: 'meter',
      header: 'Delivered vs target',
      flex: 1.6,
      render: (b) => <TargetMeter value={measured ? b.deliveredKw : 0} target={b.targetKw} />,
    },
    {
      key: 'share',
      header: '%',
      width: 56,
      align: 'right',
      render: (b) => (
        <Txt numeric weight="600" tone="ink">
          {measured ? percent(b.deliveredKw, b.targetKw) : '—'}
        </Txt>
      ),
    },
    {
      key: 'hit',
      header: 'Status',
      width: 120,
      render: (b) =>
        !measured ? (
          <Txt tone="faint">—</Txt>
        ) : b.targetHit ? (
          <Tag tone="good" label="✓ Target hit" />
        ) : (
          <Tag label="Below target" />
        ),
    },
  ];

  return (
    <>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        <Link href="/" asChild>
          <Pressable accessibilityRole="link">
            <Txt size="sm" weight="600" style={{ color: colors.brandStrong }}>
              Live load
            </Txt>
          </Pressable>
        </Link>
        <Txt size="sm" tone="faint">
          /
        </Txt>
        <Txt size="sm" tone="muted">
          {name}
        </Txt>
      </View>

      <PageHeader
        title={name ?? 'Town'}
        subtitle="Delivered load against each barangay's own share of the target."
      />

      {failed ? <Notice tone="critical">{errorMessage(failed)}</Notice> : null}

      {town ? (
        <>
          <Card padded={false}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              <Stat label="Town target" value={kw(town.targetKw)} unit="kW" />
              <Stat
                label="Committed"
                value={kw(town.committedKw)}
                unit="kW"
                note={
                  town.householdsKnown
                    ? `${percent(town.committedKw, town.targetKw)} of target · ${count(
                        town.committedHouseholds,
                      )} of ${count(town.households)} households`
                    : `${percent(town.committedKw, town.targetKw)} of target`
                }
              />
              <Stat
                label="Delivered, verified"
                value={measured ? kw(town.deliveredKw) : '—'}
                unit={measured ? 'kW' : undefined}
                note={
                  measured
                    ? `${percent(town.deliveredKw, town.targetKw)} of target · smart meter ${kw(
                        town.deliveredAmiKw,
                      )} kW, photo ${kw(town.deliveredPhotoKw)} kW`
                    : 'Measured after the window ends'
                }
              />
              <Stat
                label="Barangays on target"
                value={measured ? String(town.barangaysHit) : '—'}
                unit={measured ? `of ${town.barangays.length}` : undefined}
              />
            </View>
          </Card>
          <Card
            title="Barangays"
            padded={false}
            aside={
              draft ? (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Button small label="Cancel" disabled={save.isPending} onPress={stopEditing} />
                  <Button
                    small
                    kind="primary"
                    label="Save targets"
                    busy={save.isPending}
                    disabled={invalid || changed.length === 0}
                    onPress={() => save.mutate(undefined, { onSuccess: stopEditing })}
                  />
                </View>
              ) : editable ? (
                <Button small kind="ghost" label="Edit targets" onPress={() => setDraft({})} />
              ) : undefined
            }
          >
            <DataTable columns={columns} rows={town.barangays} rowKey={(b) => b.barangayId} />
          </Card>
          {save.error ? <Notice tone="critical">{errorMessage(save.error)}</Notice> : null}
          {draft ? (
            <Notice tone={invalid ? 'warning' : 'neutral'}>
              {invalid
                ? 'Enter a target from 0 to 1,000,000 kW for each barangay.'
                : `An override changes that barangay's share only. The alert asks for ${kw(
                    totals.data?.targetKw ?? 0,
                  )} kW in all; the barangay targets would add up to ${kw(
                    Math.round(allTargets * 10) / 10,
                  )} kW.`}
            </Notice>
          ) : null}
          <Txt size="xs" tone="muted">
            A barangay that reaches 100% of its target at settlement earns every household there
            with a verified cut a bonus on its own credit. The bonus rate is a placeholder.
          </Txt>
        </>
      ) : (
        <Card>
          <Txt tone="muted">
            {alert.data
              ? 'This town is not targeted by the current alert.'
              : 'No alert has been sent yet.'}
          </Txt>
        </Card>
      )}
    </>
  );
}
