import type { AlertLevel } from '@kapitwatt/shared';
import { useTheme } from '@kapitwatt/hooks';
import { Icon } from '@kapitwatt/icons';
import { color as roles } from '@kapitwatt/tokens';
import { Text } from '@kapitwatt/ui';
import { View } from 'react-native';
import { LiveDot } from './LiveDot';

/**
 * The alert level on Grid Indigo: red or yellow (the NGCP alert, always with the word and icon), relief
 * once settled. `live` adds the pulsing dot while commitments can still come in.
 */
export function AlertLevelPill({
  level,
  settled,
  live,
}: {
  level: AlertLevel;
  settled: boolean;
  live: boolean;
}) {
  const t = useTheme();
  const red = level === 'red';
  const [bg, fg] = settled
    ? [roles.light.reliefContainer, roles.light.onReliefContainer]
    : red
      ? [roles.light.alertRed, roles.light.onAlertRed]
      : [roles.light.alertYellow, roles.light.onAlertYellow];
  return (
    <View
      accessibilityRole={settled ? undefined : 'alert'}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: t.space[1],
        paddingHorizontal: t.space[3],
        height: 30,
        borderRadius: t.radius.full,
        backgroundColor: bg,
      }}
    >
      <Icon name={settled ? 'verified' : 'alert'} weight="fill" size="sm" color={fg} />
      <Text
        variant="labelLarge"
        style={{ color: fg, textTransform: 'uppercase', letterSpacing: 0.6 }}
      >
        {`${red ? 'Red' : 'Yellow'} alert${settled ? ' · settled' : ''}`}
      </Text>
      {live ? <LiveDot color={fg} /> : null}
    </View>
  );
}
