import { POLL_INTERVAL_MS } from '@kapitwatt/shared';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { AlertSummary } from '@/components/AlertSummary';
import { TargetMeter } from '@/components/charts';
import { DataTable, type Column } from '@/components/DataTable';
import { Button, Card, Notice, PageHeader, Stat, Tag, Txt } from '@/components/ui';
import { errorMessage } from '@/lib/client';
import { about, byTown, count, kw, percent, type TownTotals } from '@/lib/format';
import { useBarangays, useCurrentAlert, useTotals } from '@/lib/queries';

export default function OverviewScreen() {
  const router = useRouter();
  const alert = useCurrentAlert();
  const totals = useTotals(alert.data?.id);
  const barangays = useBarangays();

  const towns = byTown(totals.data);
  const status = totals.data?.status ?? alert.data?.status;
  const measured = status === 'settling' || status === 'settled';
  const failed = alert.error ?? totals.error;

  const columns: Column<TownTotals>[] = [
    {
      key: 'town',
      header: 'Town',
      flex: 1.4,
      render: (t) => (
        <Txt tone="ink" weight="600">
          {t.town}
        </Txt>
      ),
    },
    {
      key: 'households',
      header: 'Households',
      width: 100,
      align: 'right',
      render: (t) => <Txt numeric>{t.householdsKnown ? count(t.households) : '—'}</Txt>,
    },
    {
      key: 'target',
      header: 'Target kW',
      width: 90,
      align: 'right',
      render: (t) => <Txt numeric>{kw(t.targetKw)}</Txt>,
    },
    {
      key: 'committed',
      header: 'Committed kW',
      width: 110,
      align: 'right',
      render: (t) => <Txt numeric>{kw(t.committedKw)}</Txt>,
    },
    {
      key: 'delivered',
      header: 'Delivered kW',
      width: 110,
      align: 'right',
      render: (t) => <Txt numeric>{measured ? kw(t.deliveredKw) : '—'}</Txt>,
    },
    {
      key: 'meter',
      header: 'Delivered vs target',
      flex: 1.6,
      render: (t) => <TargetMeter value={measured ? t.deliveredKw : 0} target={t.targetKw} />,
    },
    {
      key: 'share',
      header: '%',
      width: 56,
      align: 'right',
      render: (t) => (
        <Txt numeric weight="600" tone="ink">
          {measured ? percent(t.deliveredKw, t.targetKw) : '—'}
        </Txt>
      ),
    },
    {
      key: 'hit',
      header: 'Barangays on target',
      width: 150,
      render: (t) =>
        !measured ? (
          <Txt tone="faint">—</Txt>
        ) : t.barangaysHit > 0 ? (
          <Tag tone="good" label={`✓ ${t.barangaysHit} of ${t.barangays.length}`} />
        ) : (
          <Txt tone="muted" numeric>
            0 of {t.barangays.length}
          </Txt>
        ),
    },
    {
      key: 'go',
      header: '',
      width: 20,
      align: 'right',
      render: () => <Txt tone="faint">›</Txt>,
    },
  ];

  // The count is optional in the API response: unknown is not the same as zero.
  const householdsKnown = (barangays.data ?? []).some((b) => b.optedInHouseholds !== undefined);
  const pilotHouseholds = (barangays.data ?? []).reduce(
    (sum, b) => sum + (b.optedInHouseholds ?? 0),
    0,
  );

  return (
    <>
      <PageHeader
        title="Live load"
        subtitle={`Committed and verified delivered load across the Laguna pilot. Refreshes every ${POLL_INTERVAL_MS / 1000} seconds.`}
        actions={
          <Button
            kind={alert.data && status !== 'settled' ? 'secondary' : 'primary'}
            label="Send alert"
            onPress={() => router.push('/alerts/new')}
          />
        }
      />

      {failed ? <Notice tone="critical">{errorMessage(failed)}</Notice> : null}

      {alert.data ? (
        <>
          <AlertSummary alert={alert.data} totals={totals.data} />
          <Card title="By town" padded={false}>
            <DataTable
              columns={columns}
              rows={towns}
              rowKey={(t) => t.town}
              onRowPress={(t) =>
                router.push({ pathname: '/towns/[town]', params: { town: t.town } })
              }
              empty="Waiting for the first totals."
            />
          </Card>
          <Txt size="xs" tone="muted">
            Results are reported per barangay. Select a town to see its barangays.
          </Txt>
        </>
      ) : (
        <Card padded={false}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            <Stat label="Committed" value="0" unit="kW" note="No alert in force" />
            <Stat
              label="Opted-in households"
              value={householdsKnown ? about(pilotHouseholds).replace('about ', '≈ ') : '—'}
              note={householdsKnown ? 'Simulated, plus team phones' : 'Not reported by the API yet'}
            />
            <Stat
              label="Coverage"
              value={String(new Set((barangays.data ?? []).map((b) => b.municipality)).size)}
              unit="towns"
              note={`${barangays.data?.length ?? 0} barangays`}
            />
          </View>
          <View style={{ padding: 16, paddingTop: 0 }}>
            <Txt size="sm" tone="muted">
              {alert.isLoading
                ? 'Loading the current alert.'
                : 'No alert has been sent. Send one to start an event.'}
            </Txt>
          </View>
        </Card>
      )}
    </>
  );
}
