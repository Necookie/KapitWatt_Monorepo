import { useTheme } from '@kapitwatt/hooks';
import type { BarangayTotals } from '@kapitwatt/shared';
import { Stack, Text } from '@kapitwatt/ui';
import { View } from 'react-native';
import { percent } from '@/utils/format';
import { useShareShade } from '../../hooks/useShareShade';
import { shareOf } from '../../utils/share';
import { Empty } from '../Empty';
import { ShareScale } from '../ShareScale';

/**
 * Town x barangay grid, each tile shaded by its share of target: a map-like overview of the pilot
 * without a basemap. Tiles that reached target use the relief role; the rest step up from the surface.
 */
export function BarangayHeatGrid({ barangays }: { barangays: BarangayTotals[] }) {
  const t = useTheme();
  const shade = useShareShade();
  if (barangays.length === 0) return <Empty>No barangays targeted.</Empty>;
  const towns = [...new Set(barangays.map((b) => b.municipality))];
  return (
    <Stack gap={3}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {towns.map((town) => (
          <View key={town} style={{ flexGrow: 1, flexBasis: 140, gap: 6 }}>
            <Text variant="labelLarge" color="onSurfaceVariant">
              {town}
            </Text>
            {barangays
              .filter((b) => b.municipality === town)
              .map((b) => {
                const share = shareOf(b);
                const hit = share >= 1;
                return (
                  <View
                    key={b.barangayId}
                    accessibilityLabel={`${b.name}, ${town}: ${percent(b.deliveredKw, b.targetKw)} of target`}
                    style={{
                      borderRadius: t.radius.sm,
                      padding: 10,
                      backgroundColor: shade(share),
                      minHeight: 58,
                      justifyContent: 'space-between',
                    }}
                  >
                    <Text
                      variant="labelMedium"
                      color={hit ? 'onRelief' : 'onSurface'}
                      numberOfLines={1}
                    >
                      {b.name}
                    </Text>
                    <Text variant="titleMedium" color={hit ? 'onRelief' : 'onSurface'}>
                      {percent(b.deliveredKw, b.targetKw)}
                    </Text>
                  </View>
                );
              })}
          </View>
        ))}
      </View>
      <ShareScale />
    </Stack>
  );
}
