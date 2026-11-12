import { useTheme } from '@kapitwatt/hooks';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Text } from './Text';

export type ChipTone =
  'neutral' | 'primary' | 'accent' | 'relief' | 'alertRed' | 'alertYellow' | 'simulated';

/**
 * Status chip (not interactive). The label must say the status in words; colour only reinforces it.
 *   relief: Verified, Delivered    alertRed / alertYellow: Red alert, Yellow alert, Flagged
 *   accent: +160 points            simulated: Simulated (dashed edge)
 */
export function Chip({
  label,
  tone = 'neutral',
  icon,
}: {
  label: string;
  tone?: ChipTone;
  icon?: ReactNode;
}) {
  const t = useTheme();
  const c = t.color;
  const [bg, fg] = (
    {
      neutral: [c.surfaceContainerHigh, c.onSurfaceVariant],
      primary: [c.primaryContainer, c.onPrimaryContainer],
      accent: [c.tertiaryContainer, c.onTertiaryContainer],
      relief: [c.reliefContainer, c.onReliefContainer],
      alertRed: [c.alertRedContainer, c.onAlertRedContainer],
      alertYellow: [c.alertYellowContainer, c.onAlertYellowContainer],
      simulated: [c.simulatedContainer, c.onSimulatedContainer],
    } as const
  )[tone];
  return (
    <View
      accessibilityRole="text"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: t.space[1],
        height: t.size.controlSm,
        paddingHorizontal: t.space[3],
        borderRadius: t.radius.sm,
        backgroundColor: bg,
        borderWidth: tone === 'simulated' ? t.borderWidth.hairline : 0,
        borderStyle: 'dashed',
        borderColor: c.simulated,
      }}
    >
      {icon}
      <Text variant="labelLarge" numberOfLines={1} style={{ color: fg }}>
        {label}
      </Text>
    </View>
  );
}
