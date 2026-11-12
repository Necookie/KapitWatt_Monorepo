import type { AlertStatus, AlertTotals } from '@kapitwatt/shared';
import type { DashboardAlert } from '@/lib/client';
import { StyleSheet, View } from 'react-native';
import { clock, count, kw, percent } from '@/lib/format';
import { colors, space } from '@/theme';
import { LoadBars } from './charts';
import { StageControl } from './StageControl';
import { Card, LegendItem, Stat, Tag, Txt } from './ui';

/** The alert in force: what was sent, where it stands, and the headline load figures. */
export function AlertSummary({
  alert,
  totals,
}: {
  alert: DashboardAlert;
  totals: AlertTotals | undefined;
}) {
  const status: AlertStatus = totals?.status ?? alert.status;
  const target = totals?.targetKw ?? alert.targetKw;
  const committed = totals?.committedKw ?? 0;
  const delivered = totals?.deliveredKw ?? 0;
  const barangays = totals?.barangays ?? [];
  const hit = barangays.filter((b) => b.targetHit).length;
  const measured = status === 'settling' || status === 'settled';

  return (
    <>
      <Card>
        <View style={{ gap: space.md }}>
          <View style={styles.headline}>
            <Tag
              label={alert.level === 'red' ? 'Red alert' : 'Yellow alert'}
              tone={alert.level === 'red' ? 'critical' : 'warning'}
            />
            <Txt tone="ink" weight="600" numeric>
              Peak window {clock(alert.windowStart)} to {clock(alert.windowEnd)}
            </Txt>
            <Txt size="sm" tone="muted" numeric>
              Sent {clock(alert.createdAt)} by {alert.createdBy} · {barangays.length} barangays
              targeted
            </Txt>
          </View>
          <StageControl alert={alert} status={status} />
        </View>
      </Card>

      <Card padded={false}>
        <View style={styles.stats}>
          <Stat label="Target" value={kw(target)} unit="kW" note="Relief asked for" />
          <View style={styles.divider} />
          <Stat
            label="Committed"
            value={kw(committed)}
            unit="kW"
            note={`${percent(committed, target)} of target${
              totals?.committedHouseholds !== undefined
                ? ` · ${count(totals.committedHouseholds)} households`
                : ''
            }`}
          />
          <View style={styles.divider} />
          <Stat
            label="Delivered, verified"
            value={measured ? kw(delivered) : '—'}
            unit={measured ? 'kW' : undefined}
            note={
              measured
                ? `${percent(delivered, target)} of target`
                : 'Measured after the window ends'
            }
          />
          <View style={styles.divider} />
          <Stat
            label="Barangays on target"
            value={measured ? String(hit) : '—'}
            unit={measured ? `of ${barangays.length}` : undefined}
            note={measured ? 'Bonus applies where the target is reached' : 'Decided at settlement'}
          />
        </View>
      </Card>

      <Card
        title="Committed and delivered load against target"
        aside={
          <View style={styles.legend}>
            <LegendItem color={colors.series.committed} label="Committed" />
            <LegendItem color={colors.series.deliveredAmi} label="Delivered, smart meter" />
            <LegendItem color={colors.series.deliveredPhoto} label="Delivered, meter photo" />
          </View>
        }
      >
        <LoadBars
          targetKw={target}
          committedKw={committed}
          deliveredKw={delivered}
          deliveredAmiKw={totals?.deliveredAmiKw ?? 0}
          deliveredPhotoKw={totals?.deliveredPhotoKw ?? 0}
        />
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  headline: { flexDirection: 'row', alignItems: 'center', gap: space.md, flexWrap: 'wrap' },
  stats: { flexDirection: 'row', flexWrap: 'wrap' },
  divider: { width: 1, backgroundColor: colors.border, marginVertical: space.md },
  legend: { flexDirection: 'row', gap: space.md, flexWrap: 'wrap' },
});
