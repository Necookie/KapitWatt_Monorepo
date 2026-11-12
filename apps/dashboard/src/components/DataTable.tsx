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
}: {
  columns: Column<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string;
  onRowPress?: (row: Row) => void;
  empty?: string;
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
      {rows.length === 0 ? (
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
