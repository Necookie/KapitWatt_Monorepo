import type { BarangayWithCount } from '@kapitwatt/shared';
import { useTheme } from '@kapitwatt/hooks';
import { Icon } from '@kapitwatt/icons';
import { Text } from '@kapitwatt/ui';
import { View } from 'react-native';
import { ChoiceChip } from '@/components/ChoiceChip';

/**
 * Demo: towns on tonight's rotational brownout schedule (simulated; KapitWatt has no feeder or
 * outage data). Marking one targets all pilot areas and names it in the message, so everyone is
 * asked to help. Targets and payouts do not change.
 */
export function AtRiskPicker({
  byTown,
  atRisk,
  onToggleTown,
}: {
  byTown: [string, BarangayWithCount[]][];
  atRisk: Set<string>;
  onToggleTown: (ids: string[], on: boolean) => void;
}) {
  const t = useTheme();
  return (
    <View
      style={{
        gap: t.space[2],
        paddingBottom: t.space[4],
        borderBottomWidth: t.borderWidth.hairline,
        borderBottomColor: t.color.outlineVariant,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[2] }}>
        <Icon name="alert" size="sm" color="error" />
        <Text variant="titleSmall">At risk of brownout</Text>
      </View>
      <Text variant="bodySmall" color="onSurfaceVariant">
        Optional. Pick the towns on tonight’s rotational schedule. All pilot areas are then
        targeted, and the others are asked to help them.
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space[1] }}>
        {byTown.map(([town, list]) => {
          const on = list.some((b) => atRisk.has(b.id));
          return (
            <ChoiceChip
              key={town}
              label={town}
              accessibilityLabel={`${town}: at risk of brownout`}
              selected={on}
              onPress={() =>
                onToggleTown(
                  list.map((b) => b.id),
                  !on,
                )
              }
            />
          );
        })}
      </View>
    </View>
  );
}
