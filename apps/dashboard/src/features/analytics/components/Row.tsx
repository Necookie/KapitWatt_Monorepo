import type { ReactNode } from 'react';
import { View } from 'react-native';

/** A responsive row of panels that wraps on narrow screens. */
export function Row({ children }: { children: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, alignItems: 'stretch' }}>
      {children}
    </View>
  );
}
