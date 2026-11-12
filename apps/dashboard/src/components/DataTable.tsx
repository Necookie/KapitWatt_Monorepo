import { Skeleton } from '@kapitwatt/ui';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, space } from '@/theme';
import { Label, Txt } from './ui';

export interface Column<Row> {
  key: string;
  header: string;
  /** Fixed width in px, or a flex weight when `flex` is set. */
  width?: number;
  flex?: number;
  align?: 'left' | 'right';
  render: (row: Row) => ReactNode;
}

/** A dense table. Rows become links when `onRowPress` is given. */
export function DataTable<Row>({
  columns,
  rows,
  rowKey,
  onRowPress,
  empty,
  loading = false,
  skeletonRows = 5,
}: {
  columns: Column<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string;
  onRowPress?: (row: Row) => void;
  empty?: string;
  /** Placeholder rows shaped like the columns while the first data loads. */
  loading?: boolean;
  skeletonRows?: number;
}) {
  const cellStyle = (c: Column<Row>) => [
    styles.cell,
    c.width ? { width: c.width } : { flex: c.flex ?? 1, minWidth: 0 },
    c.align === 'right' ? styles.right : null,
  ];

  return (
    <View accessibilityRole={'table' as never}>
      <View style={styles.head}>
        {columns.map((c) => (
          <View key={c.key} style={cellStyle(c)}>
            <Label>{c.header}</Label>
          </View>
        ))}
      </View>
      {loading && rows.length === 0
        ? Array.from({ length: skeletonRows }, (_, i) => (
            <View key={i} style={styles.row} accessibilityLabel={i === 0 ? 'Loading' : undefined}>
              {columns.map((c, ci) => (
                <View key={c.key} style={cellStyle(c)}>
                  {c.header || c.width === undefined || c.width > 24 ? (
                    // Vary the widths a little so the rows read as text, not a grid of bars.
                    <Skeleton width={`${[78, 55, 66, 48, 72][(i + ci) % 5]}%`} height={10} />
                  ) : null}
                </View>
              ))}
            </View>
          ))
        : null}
      {!loading && rows.length === 0 ? (
        <View style={styles.empty}>
          <Txt size="sm" tone="muted">
            {empty ?? 'Nothing to show yet.'}
          </Txt>
        </View>
      ) : null}
      {rows.map((row) => {
        const cells = columns.map((c) => (
          <View key={c.key} style={cellStyle(c)}>
            {c.render(row)}
          </View>
        ));
        return onRowPress ? (
          <Pressable
            key={rowKey(row)}
            accessibilityRole="link"
            onPress={() => onRowPress(row)}
            style={({ hovered }: { pressed: boolean; hovered?: boolean }) => [
              styles.row,
              hovered ? styles.rowHover : null,
            ]}
          >
            {cells}
          </Pressable>
        ) : (
          <View key={rowKey(row)} style={styles.row}>
            {cells}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    paddingHorizontal: space.lg,
    backgroundColor: colors.surfaceAlt,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 36,
    paddingHorizontal: space.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowHover: { backgroundColor: colors.surfaceAlt },
  cell: { paddingRight: space.md, justifyContent: 'center' },
  right: { alignItems: 'flex-end' },
  empty: { padding: space.lg },
});
