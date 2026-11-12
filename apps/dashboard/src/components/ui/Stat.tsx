import { Skeleton } from '@kapitwatt/ui';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { space } from '@/styles/theme';
import { Label } from './Label';
import { Txt } from './Txt';
import { motion } from '@/styles/motion';

/** One headline figure with its unit and a line of context. */
export function Stat({
  label,
  value,
  unit,
  note,
  children,
  loading = false,
}: {
  label: string;
  value: string;
  unit?: string;
  note?: string;
  children?: ReactNode;
  /** Keep the label, stand in for the figure and its note. */
  loading?: boolean;
}) {
  if (loading) {
    return (
      <View style={styles.stat} accessibilityLabel={`${label}: loading`}>
        <Label>{label}</Label>
        <Skeleton width={96} height={30} radius="sm" style={{ marginVertical: 3 }} />
        <Skeleton width="70%" height={10} />
      </View>
    );
  }
  return (
    <View key="figure" style={styles.stat}>
      <Label>{label}</Label>
      <View style={[styles.statValue, motion.fadeIn]}>
        <Txt size="kpi" tone="ink" weight="600" numeric>
          {value}
        </Txt>
        {unit ? (
          <Txt size="md" tone="muted" weight="500">
            {unit}
          </Txt>
        ) : null}
      </View>
      {note ? (
        <Txt size="sm" tone="muted" numeric>
          {note}
        </Txt>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  stat: { flexGrow: 1, flexBasis: 180, gap: 2, padding: space.lg },
  statValue: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
});
