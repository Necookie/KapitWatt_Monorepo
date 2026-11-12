import { Icon } from '@kapitwatt/icons';
import { Chip } from '@kapitwatt/ui';

export function SimulatedChip() {
  return (
    <Chip
      label="Simulated"
      tone="simulated"
      icon={<Icon name="simulated" size="sm" color="onSimulatedContainer" />}
    />
  );
}
