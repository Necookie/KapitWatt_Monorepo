import type { AlertAnalytics } from '@kapitwatt/shared';
import { Stack } from '@kapitwatt/ui';
import { count, kw, percent, php } from '@/utils/format';
import { useChartColors } from '../../hooks/useChartColors';
import { grow } from '../../utils/layout';
import { AnalyticsPanel } from '../AnalyticsPanel';
import { CommitTimeline } from '../charts/CommitTimeline';
import { Donut } from '../charts/Donut';
import { TargetGauge } from '../charts/TargetGauge';
import { Empty } from '../Empty';
import { KpiCard } from '../KpiCard';
import { Row } from '../Row';

export function OverviewView({
  a,
  deliveredAmiKw,
  deliveredPhotoKw,
}: {
  a: AlertAnalytics;
  deliveredAmiKw?: number;
  deliveredPhotoKw?: number;
}) {
  const c = useChartColors();
  const settled = a.status === 'settled';
  const paid = a.payouts.creditPhp + a.payouts.bonusPhp;
  const split = deliveredAmiKw !== undefined && deliveredPhotoKw !== undefined;
  return (
    <Stack gap={4}>
      <Row>
        <KpiCard
          label="Committed"
          icon="commit"
          value={kw(a.committedKw)}
          unit="kW"
          caption={`${percent(a.committedKw, a.targetKw)} of the ${kw(a.targetKw)} kW target`}
          progress={{
            share: a.committedKw / Math.max(a.targetKw, 1e-9),
            tone: 'primary',
            label: 'Committed against target',
          }}
        />
        <KpiCard
          label="Delivered"
          icon="energy"
          value={kw(a.deliveredKw)}
          unit="kW"
          caption={`${percent(a.deliveredKw, a.targetKw)} of target, ${settled ? 'settled' : 'live'}`}
          progress={{
            share: a.deliveredKw / Math.max(a.targetKw, 1e-9),
            tone: 'relief',
            label: 'Delivered against target',
          }}
        />
        <KpiCard
          label="Participation"
          icon="home"
          value={percent(a.committedHouseholds, a.optedInHouseholds)}
          caption={`${count(a.committedHouseholds)} of ${count(a.optedInHouseholds)} opted-in households`}
        />
        <KpiCard
          label="On target"
          icon="barangay"
          value={`${a.barangaysAtTarget}`}
          unit={`of ${a.barangays}`}
          caption="Barangays at target: verified households there earn the bonus"
        />
        <KpiCard
          label="Verified energy"
          icon="verified"
          value={kw(a.verifiedKwh)}
          unit="kWh"
          caption={settled ? 'Paid at settlement' : 'Counted at settlement'}
        />
        <KpiCard
          label="Paid out"
          icon="reward"
          value={paid.toLocaleString('en-PH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
          unit="PHP"
          caption={
            a.payouts.costPerKwhPhp !== null
              ? `${php(a.payouts.costPerKwhPhp)} per kWh · ${count(a.payouts.points)} points`
              : 'After settlement'
          }
        />
      </Row>
      <Row>
        <AnalyticsPanel title="Delivered against target" icon="chartBar" style={grow(300, 2)}>
          <TargetGauge deliveredKw={a.deliveredKw} targetKw={a.targetKw} settled={settled} />
        </AnalyticsPanel>
        <AnalyticsPanel
          title="Delivered by verification path"
          icon="meter"
          note="Smart meters need no photos, so none of their kW is lost to a missed one."
          style={grow(380, 3)}
        >
          {split ? (
            <Donut
              segments={[
                { label: 'Smart meter', value: deliveredAmiKw, color: c.ami },
                { label: 'Meter photo', value: deliveredPhotoKw, color: c.photo },
              ]}
              center={kw(deliveredAmiKw + deliveredPhotoKw)}
              empty="No verified kW yet. It shows once readings pass their checks."
              centerCaption="kW delivered"
              format={(v) => `${kw(v)} kW`}
            />
          ) : (
            <Empty>Available once delivery is measured.</Empty>
          )}
        </AnalyticsPanel>
      </Row>
      <AnalyticsPanel
        title="Commitments over time"
        icon="chartLine"
        note="Hover for the committed load at any moment of the commit phase."
      >
        <CommitTimeline timeline={a.timeline} targetKw={a.targetKw} />
      </AnalyticsPanel>
    </Stack>
  );
}
