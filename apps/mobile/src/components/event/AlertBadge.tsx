import { Icon } from '@kapitwatt/icons';
import type { AlertLevel } from '@kapitwatt/shared';
import { Chip } from '@kapitwatt/ui';

/** NGCP alert level as a chip: the level in words plus the alert icon, never colour alone. */
export function AlertBadge(props: { level: AlertLevel }) {
  const red = props.level === 'red';
  return (
    <Chip
      label={red ? 'Red alert' : 'Yellow alert'}
      tone={red ? 'alertRed' : 'alertYellow'}
      icon={
        <Icon
          name="alert"
          size="sm"
          weight="fill"
          color={red ? 'onAlertRedContainer' : 'onAlertYellowContainer'}
        />
      }
    />
  );
}
