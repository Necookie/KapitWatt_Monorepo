import { useTheme } from '@kapitwatt/hooks';
import { Icon, type IconName } from '@kapitwatt/icons';
import { Text } from '@kapitwatt/ui';
import type { ReactNode } from 'react';
import { View } from 'react-native';

/** Empty state inside a panel. */
/** Nothing to plot yet: centred in the panel with a quiet icon, so an empty chart still looks placed. */
export function Empty({ children, icon = 'chartBar' }: { children: ReactNode; icon?: IconName }) {
  const t = useTheme();
  return (
    <View
      style={{
        minHeight: 160,
        alignItems: 'center',
        justifyContent: 'center',
        gap: t.space[2],
        padding: t.space[4],
        borderRadius: t.radius.md,
        backgroundColor: t.color.surfaceContainerLow,
      }}
    >
      <Icon name={icon} size="lg" color="onSurfaceVariant" />
      <Text variant="bodyMedium" color="onSurfaceVariant" style={{ textAlign: 'center' }}>
        {children}
      </Text>
    </View>
  );
}
