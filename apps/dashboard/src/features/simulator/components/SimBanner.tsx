import type { SimStatus } from '@kapitwatt/shared';
import { useTheme } from '@kapitwatt/hooks';
import { Icon } from '@kapitwatt/icons';
import { Chip, Text } from '@kapitwatt/ui';
import { View } from 'react-native';
import { count } from '@/utils/format';

/** What is seeded, in the simulated tone with a dashed edge: everything on this page is made up. */
export function SimBanner({ status, enabled }: { status?: SimStatus; enabled: boolean }) {
  const t = useTheme();
  const seeded = status?.simulatedHouseholds ?? 0;
  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: t.space[3],
        paddingHorizontal: t.space[5],
        paddingVertical: t.space[4],
        borderRadius: t.radius.lg,
        borderWidth: t.borderWidth.strong,
        borderStyle: 'dashed',
        borderColor: t.color.simulated,
        backgroundColor: t.color.surfaceContainerLow,
      }}
    >
      <Chip
        label="Simulated"
        tone="simulated"
        icon={<Icon name="simulated" size="sm" color="onSimulatedContainer" />}
      />
      <Text variant="titleMedium">
        {!enabled
          ? 'Simulator off'
          : seeded > 0
            ? `${count(seeded)} households seeded`
            : 'No simulated households yet'}
      </Text>
      <Text variant="bodyMedium" color="onSurfaceVariant" style={{ flexShrink: 1 }}>
        {!enabled
          ? 'This API is not running in the demo environment.'
          : seeded > 0
            ? `${count(status?.amiHouseholds ?? 0)} smart meter · ${count(status?.photoHouseholds ?? 0)} meter photo · every value here is an assumption`
            : 'Seed Laguna to create them. Every value here is an assumption.'}
      </Text>
    </View>
  );
}
