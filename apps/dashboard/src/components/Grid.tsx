import { useTheme } from '@kapitwatt/hooks';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useLayoutValue } from '@/hooks/useLayoutValue';

/**
 * Equal columns for the space the grid actually has (not the window): the widest count from `columns`
 * whose cells stay at least `min` wide. Cells are percentages, so they stay fluid while the width
 * settles (the sidebar animating); a short last row keeps the column width instead of stretching.
 */
export function Grid({
  children,
  min,
  columns = [4, 3, 2, 1],
}: {
  children: ReactNode[];
  min: number;
  columns?: number[];
}) {
  const t = useTheme();
  const gap = t.space[3];
  const [cols, onLayout] = useLayoutValue(
    (width) => columns.find((n) => (width - gap * (n - 1)) / n >= min) ?? 1,
  );
  return (
    <View
      onLayout={onLayout}
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        rowGap: gap,
        marginHorizontal: -gap / 2,
      }}
    >
      {children.map((child, i) => (
        <View key={i} style={{ width: `${100 / cols}%`, paddingHorizontal: gap / 2 }}>
          {child}
        </View>
      ))}
    </View>
  );
}
