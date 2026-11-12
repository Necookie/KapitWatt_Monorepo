import { useTheme } from '@kapitwatt/hooks';
import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';

/** Stays in view while the composer scrolls (web: sticky inside the page's scroll view). */
export function StickyRail({ sticky, children }: { sticky: boolean; children: ReactNode }) {
  const t = useTheme();
  return (
    <View
      style={
        (sticky
          ? {
              position: 'sticky',
              top: t.space[4],
              alignSelf: 'flex-start',
              width: '100%',
              gap: t.space[4],
            }
          : { gap: t.space[4] }) as unknown as ViewStyle
      }
    >
      {children}
    </View>
  );
}
