import { themes } from '@kapitwatt/styles';
import { Text } from '@kapitwatt/ui';
import { StyleSheet, View } from 'react-native';
import { ProgressBar } from '@/components/ui';
import { formatKw } from '@/utils/format';
import { useAlertTotals } from '@/api/queries';
import { radius, space } from '@/styles/theme';

const c = themes.light.color;

/** The household's barangay against tonight's target, polled with the alert totals. */
export function BarangayTonight(props: { alertId: string; barangayId: string }) {
  const totals = useAlertTotals(props.alertId);
  const row = totals.data?.barangays.find((b) => b.barangayId === props.barangayId);
  if (!row) return null;
  const share = row.targetKw > 0 ? row.committedKw / row.targetKw : 0;
  return (
    <View style={styles.panel}>
      <View style={styles.panelHead}>
        <Text variant="titleMedium">{row.name} tonight</Text>
        <Text variant="bodyMedium" color="onSurfaceVariant" style={styles.tabular}>
          Target {formatKw(row.targetKw)}
        </Text>
      </View>
      <ProgressBar
        value={share}
        tone="primary"
        accessibilityLabel={`${Math.round(share * 100)}% of the target committed`}
      />
      <Text variant="bodyMedium" color="onSurfaceVariant">
        {`${formatKw(row.committedKw)} committed by your neighbours so far`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tabular: { fontVariant: ['tabular-nums'] },
  panel: {
    borderRadius: radius.lg,
    backgroundColor: c.surfaceContainerLow,
    padding: space.lg,
    gap: 10,
  },
  panelHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
});
