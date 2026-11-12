import type { BarangayTotals } from '@kapitwatt/shared';
import { DataTable, type Column } from '@/components/DataTable';
import { TextField } from '@/components/ui/TextField';
import { TargetMeter } from '@/components/TargetMeter';
import { Tag } from '@/components/ui/Tag';
import { Txt } from '@/components/ui/Txt';
import { count, kw, percent } from '@/utils/format';

interface Props {
  rows: BarangayTotals[];
  measured: boolean;
  /** True while the operator is overriding targets: the target column becomes inputs. */
  editing?: boolean;
  typed?: (b: BarangayTotals) => string;
  onChangeTarget?: (b: BarangayTotals, text: string) => void;
  loading?: boolean;
}

export function BarangayTable({ rows, measured, editing, typed, onChangeTarget, loading }: Props) {
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
        editing && typed && onChangeTarget ? (
          <TextField
            label={`Target kW for ${b.name}`}
            numeric
            width={72}
            value={typed(b)}
            onChangeText={(text) => onChangeTarget(b, text)}
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
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(b) => b.barangayId}
      loading={loading}
      skeletonRows={3}
    />
  );
}
