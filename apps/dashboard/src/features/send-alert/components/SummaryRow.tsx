import { useTheme } from '@kapitwatt/hooks';
import { Text } from '@kapitwatt/ui';
import type { ReactNode } from 'react';
import { View } from 'react-native';

export function SummaryRow({ label, children }: { label: string; children: ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: t.space[3] }}>
      <Text variant="labelLarge" color="onSurfaceVariant" style={{ width: 72 }}>
        {label}
      </Text>
      <View style={{ flex: 1, minWidth: 0 }}>{children}</View>
    </View>
  );
}
