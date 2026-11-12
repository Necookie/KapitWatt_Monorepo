import { useTheme } from '@kapitwatt/hooks';
import type { BarangayTotals } from '@kapitwatt/shared';
import { Text } from '@kapitwatt/ui';
import { View } from 'react-native';
import { count, kw, percent } from '@/utils/format';

/** Totals by town: households, committed, delivered, share of target, barangays at target. */
export function TownTable({ barangays }: { barangays: BarangayTotals[] }) {
  const t = useTheme();
  const towns = [...new Set(barangays.map((b) => b.municipality))].map((town) => {
    const rows = barangays.filter((b) => b.municipality === town);
    const sum = (k: 'targetKw' | 'committedKw' | 'deliveredKw') =>
      rows.reduce((s, b) => s + b[k], 0);
    return {
      town,
      households: rows.reduce((s, b) => s + (b.households ?? 0), 0),
      target: sum('targetKw'),
      committed: sum('committedKw'),
      delivered: sum('deliveredKw'),
      hit: rows.filter((b) => b.targetHit).length,
      count: rows.length,
    };
  });
  towns.sort(
    (a, b) => b.delivered / Math.max(b.target, 1e-9) - a.delivered / Math.max(a.target, 1e-9),
  );
  const cols = [
    { key: 'town', label: 'Town', flex: 1.4, align: 'left' as const },
    { key: 'households', label: 'Households', flex: 1, align: 'right' as const },
    { key: 'committed', label: 'Committed', flex: 1, align: 'right' as const },
    { key: 'delivered', label: 'Delivered', flex: 1, align: 'right' as const },
    { key: 'share', label: 'Of target', flex: 0.9, align: 'right' as const },
    { key: 'hit', label: 'At target', flex: 0.9, align: 'right' as const },
  ];
  const cell = (row: (typeof towns)[number], key: string) =>
    key === 'town'
      ? row.town
      : key === 'households'
        ? count(row.households)
        : key === 'committed'
          ? `${kw(row.committed)} kW`
          : key === 'delivered'
            ? `${kw(row.delivered)} kW`
            : key === 'share'
              ? percent(row.delivered, row.target)
              : `${row.hit} of ${row.count}`;
  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          paddingBottom: 8,
          borderBottomWidth: 1,
          borderBottomColor: t.color.outlineVariant,
        }}
      >
        {cols.map((col) => (
          <Text
            key={col.key}
            variant="labelMedium"
            color="onSurfaceVariant"
            style={{ flex: col.flex, textAlign: col.align }}
          >
            {col.label}
          </Text>
        ))}
      </View>
      {towns.map((row) => (
        <View
          key={row.town}
          style={{
            flexDirection: 'row',
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: t.color.outlineVariant,
          }}
        >
          {cols.map((col) => (
            <Text
              key={col.key}
              variant={col.key === 'town' ? 'labelLarge' : 'bodyMedium'}
              style={{ flex: col.flex, textAlign: col.align }}
            >
              {cell(row, col.key)}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}
