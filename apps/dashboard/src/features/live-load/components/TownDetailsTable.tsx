import { memo } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { motion } from '@/styles/motion';
import { DataTable, type Column } from '@/components/DataTable';
import { TargetMeter } from '@/components/TargetMeter';
import { Tag } from '@/components/ui/Tag';
import { Txt } from '@/components/ui/Txt';
import { count, kw, percent, type TownTotals } from '@/utils/format';

/** Figures by town in kW; delivered columns stay blank until measured. Each row opens its town. */
export const TownDetailsTable = memo(function TownDetailsTable({
  towns,
  measured,
}: {
  towns: TownTotals[];
  measured: boolean;
}) {
  const router = useRouter();

  const columns: Column<TownTotals>[] = [
    {
      key: 'town',
      header: 'Town',
      flex: 1.4,
      render: (r) => (
        <Txt tone="ink" weight="600">
          {r.town}
        </Txt>
      ),
    },
    {
      key: 'households',
      header: 'Households',
      width: 100,
      align: 'right',
      render: (r) => <Txt numeric>{r.householdsKnown ? count(r.households) : '—'}</Txt>,
    },
    {
      key: 'target',
      header: 'Target',
      width: 90,
      align: 'right',
      render: (r) => <Txt numeric>{kw(r.targetKw)}</Txt>,
    },
    {
      key: 'committed',
      header: 'Committed',
      width: 110,
      align: 'right',
      render: (r) => <Txt numeric>{kw(r.committedKw)}</Txt>,
    },
    {
      key: 'delivered',
      header: 'Delivered',
      width: 110,
      align: 'right',
      render: (r) => <Txt numeric>{measured ? kw(r.deliveredKw) : '—'}</Txt>,
    },
    {
      key: 'meter',
      header: 'Against target',
      flex: 1.6,
      render: (r) => <TargetMeter value={measured ? r.deliveredKw : 0} target={r.targetKw} />,
    },
    {
      key: 'share',
      header: '%',
      width: 56,
      align: 'right',
      render: (r) => (
        <Txt numeric weight="600" tone="ink">
          {measured ? percent(r.deliveredKw, r.targetKw) : '—'}
        </Txt>
      ),
    },
    {
      key: 'hit',
      header: 'On target',
      width: 110,
      render: (r) =>
        !measured ? (
          <Txt tone="faint">—</Txt>
        ) : r.barangaysHit > 0 ? (
          // Keyed by the count, so it pops each time another barangay reaches its target.
          <View key={r.barangaysHit} style={motion.pop}>
            <Tag tone="good" label={`${r.barangaysHit} of ${r.barangays.length}`} />
          </View>
        ) : (
          <Txt tone="muted" numeric>
            0 of {r.barangays.length}
          </Txt>
        ),
    },
  ];

  return (
    // Fixed columns: on a phone the table scrolls sideways inside its card, not the page.
    <ScrollView horizontal contentContainerStyle={{ flexGrow: 1 }}>
      <View style={{ flex: 1, minWidth: 760 }}>
        <DataTable
          columns={columns}
          rows={towns}
          rowKey={(r) => r.town}
          onRowPress={(r) => router.push({ pathname: '/towns/[town]', params: { town: r.town } })}
          empty="Waiting for the first totals."
        />
      </View>
    </ScrollView>
  );
});
