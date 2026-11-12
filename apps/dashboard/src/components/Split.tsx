import { useTheme } from '@kapitwatt/hooks';
import type { ReactNode } from 'react';
import { View } from 'react-native';

/**
 * Two bento cells side by side at `ratio` (12 columns), stretched to the same height; stacked when the
 * row is not `wide`.
 */
export function Split({
  wide,
  ratio = [8, 4],
  children,
}: {
  wide: boolean;
  ratio?: [number, number];
  children: [ReactNode, ReactNode];
}) {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: wide ? 'row' : 'column',
        alignItems: 'stretch',
        gap: t.space[4],
      }}
    >
      <View style={{ flex: wide ? ratio[0] : undefined, minWidth: 0 }}>{children[0]}</View>
      <View style={{ flex: wide ? ratio[1] : undefined, minWidth: 0 }}>{children[1]}</View>
    </View>
  );
}
