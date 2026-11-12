import type { BarangayWithCount } from '@kapitwatt/shared';
import { useTheme } from '@kapitwatt/hooks';
import { Icon } from '@kapitwatt/icons';
import { Text } from '@kapitwatt/ui';
import { View } from 'react-native';
import { about } from '@/utils/format';
import { Grid } from '@/components/Grid';
import { Panel } from '@/components/Panel';

/** The pilot's towns and their sampled barangays, as the alert form will target them. */
export function Coverage({ barangays }: { barangays: BarangayWithCount[] }) {
  const t = useTheme();
  const towns = new Map<string, BarangayWithCount[]>();
  for (const b of barangays) towns.set(b.municipality, [...(towns.get(b.municipality) ?? []), b]);
  return (
    <Panel
      title="Pilot coverage"
      subtitle="Seven Meralco franchise towns in Laguna, three sampled barangays each."
    >
      {towns.size === 0 ? (
        <Text variant="bodyMedium" color="onSurfaceVariant">
          Loading the pilot barangays.
        </Text>
      ) : (
        <Grid min={220}>
          {[...towns].map(([town, list]) => {
            const known = list.some((b) => b.optedInHouseholds !== undefined);
            const households = list.reduce((sum, b) => sum + (b.optedInHouseholds ?? 0), 0);
            return (
              <View
                key={town}
                style={{
                  flex: 1,
                  gap: t.space[2],
                  padding: t.space[4],
                  borderRadius: t.radius.md,
                  backgroundColor: t.color.surfaceContainerLow,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[2] }}>
                  <Icon name="town" size="sm" color="primary" />
                  <Text variant="titleMedium" style={{ flex: 1 }} numberOfLines={1}>
                    {town}
                  </Text>
                  <Text variant="labelLarge" color="onSurfaceVariant">
                    {known ? about(households).replace('about ', '≈ ') : '—'}
                  </Text>
                </View>
                <Text variant="bodySmall" color="onSurfaceVariant">
                  {list.map((b) => b.name).join(' · ')}
                </Text>
              </View>
            );
          })}
        </Grid>
      )}
    </Panel>
  );
}
