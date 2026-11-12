import { useTheme } from '@kapitwatt/hooks';
import { Icon } from '@kapitwatt/icons';
import { Text } from '@kapitwatt/ui';
import { View } from 'react-native';

/** How the barangay bonus works, under the cards. */
export function BonusNote() {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: t.space[2] }}>
      <Icon name="info" size="sm" color="onSurfaceVariant" />
      <Text variant="bodySmall" color="onSurfaceVariant" style={{ flex: 1 }}>
        A barangay that reaches 100% of its target at settlement earns every household there with a
        verified cut a bonus on its own credit. The bonus rate is a placeholder.
      </Text>
    </View>
  );
}
