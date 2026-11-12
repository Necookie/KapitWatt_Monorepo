import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, space, text } from '@/theme';

export function Card(props: { title?: string; children: ReactNode }) {
  return (
    <View style={styles.card}>
      {props.title ? <Text style={styles.title}>{props.title}</Text> : null}
      {props.children}
    </View>
  );
}

/** A label and its value on one line, e.g. "Commitment   1.0 kW". */
export function Row(props: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{props.label}</Text>
      <Text style={[styles.value, props.strong && styles.strong]}>{props.value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.sm,
  },
  title: { ...text.title, color: colors.ink },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: space.md },
  label: { ...text.body, color: colors.muted, flexShrink: 1 },
  value: { ...text.body, color: colors.ink, fontVariant: ['tabular-nums'] },
  strong: { fontWeight: '700' },
});
