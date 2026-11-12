import { barangayProgress, type BarangayTotals } from '@kapitwatt/shared';
import { StyleSheet } from 'react-native';
import { themes } from '@kapitwatt/styles';
import { Text } from '@kapitwatt/ui';
import { Card, ProgressBar, Row } from '@/components/ui';
import { formatKw } from '@/utils/format';

const c = themes.light.color;

/** Verified delivered kW in the household's barangay against its target (PRD 6). */
export function BarangayProgress(props: { row: BarangayTotals; settled: boolean }) {
  const { row } = props;
  const pct = Math.round(barangayProgress(row.deliveredKw, row.targetKw) * 100);
  return (
    <Card title={`${row.name}, ${row.municipality}`}>
      <ProgressBar value={barangayProgress(row.deliveredKw, row.targetKw)} />
      <Row
        label="Delivered"
        value={`${formatKw(row.deliveredKw)} of ${formatKw(row.targetKw)} (${pct}%)`}
        strong
      />
      <Row label="Committed by neighbours" value={formatKw(row.committedKw)} />
      <Text variant="bodyMedium" style={styles.note}>
        {row.targetHit
          ? 'Target reached. Every household here with a verified cut earns the barangay bonus.'
          : props.settled
            ? 'Target not reached this time.'
            : 'Smart-meter cuts count live. Photo cuts are added after the results are in.'}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  note: { color: c.onSurfaceVariant },
});
