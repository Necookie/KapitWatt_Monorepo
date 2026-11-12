import { useTheme } from '@kapitwatt/hooks';
import { Icon } from '@kapitwatt/icons';
import { Text } from '@kapitwatt/ui';
import { View } from 'react-native';

/** The Simulated pill for the rail: a dashed icon pill with a one-word label, in the chip's tone. */
export function SimulatedPill() {
  const t = useTheme();
  return (
    <View accessibilityLabel="Simulated pilot" style={{ alignItems: 'center', gap: t.space[1] }}>
      <View
        style={{
          width: 40,
          height: 32,
          borderRadius: t.radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: t.borderWidth.hairline,
          borderStyle: 'dashed',
          borderColor: t.color.simulated,
          backgroundColor: t.color.simulatedContainer,
        }}
      >
        <Icon name="simulated" size="sm" color="onSimulatedContainer" />
      </View>
      <Text variant="labelSmall" color="onSurfaceVariant">
        Simulated
      </Text>
    </View>
  );
}
