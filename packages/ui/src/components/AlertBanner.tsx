import { useTheme } from '@kapitwatt/hooks';
import { Icon } from '@kapitwatt/icons';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Text } from './Text';

export type AlertBannerProps = {
  level: 'red' | 'yellow';
  /** "Red alert sa Luzon grid" */
  title: string;
  /** "Magbawas ng 1 kW, 6:00 to 8:00 PM" */
  message?: string;
  action?: ReactNode;
};

/**
 * NGCP grid alert. Always shows the level in words and a warning icon, so it never relies on colour alone.
 * Red and yellow are reserved for alerts; do not reuse this component for errors.
 */
export function AlertBanner({ level, title, message, action }: AlertBannerProps) {
  const t = useTheme();
  const c = t.color;
  const [bg, fg] = level === 'red' ? [c.alertRed, c.onAlertRed] : [c.alertYellow, c.onAlertYellow];
  return (
    <View
      accessibilityRole="alert"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: t.space[3],
        padding: t.space[4],
        borderRadius: t.radius.lg,
        backgroundColor: bg,
      }}
    >
      <Icon name="alert" weight="fill" size="lg" color={fg} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="labelMedium" style={{ color: fg, textTransform: 'uppercase' }}>
          {level === 'red' ? 'Red alert' : 'Yellow alert'}
        </Text>
        <Text variant="titleMedium" style={{ color: fg }}>
          {title}
        </Text>
        {message ? (
          <Text variant="bodyMedium" style={{ color: fg }}>
            {message}
          </Text>
        ) : null}
      </View>
      {action}
    </View>
  );
}
