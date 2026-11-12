import { useTheme } from '@kapitwatt/hooks';
import { Text } from '@kapitwatt/ui';
import type { ReactNode } from 'react';
import { View } from 'react-native';

/** A labelled row of choices: the label in a fixed column, so rows line up and wrap cleanly. */
export function OptionRow({ label, children }: { label: string; children: ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: t.space[2] }}>
      <Text variant="labelLarge" color="onSurfaceVariant" style={{ width: 64 }}>
        {label}
      </Text>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={label}
        style={{
          flex: 1,
          minWidth: 200,
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: t.space[2],
        }}
      >
        {children}
      </View>
    </View>
  );
}
