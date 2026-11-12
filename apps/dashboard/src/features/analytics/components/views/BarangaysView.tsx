import type { BarangayTotals } from '@kapitwatt/shared';
import { Skeleton, Stack } from '@kapitwatt/ui';
import { grow } from '../../utils/layout';
import { AnalyticsPanel } from '../AnalyticsPanel';
import { BarangayHeatGrid } from '../charts/BarangayHeatGrid';
import { BarangayRanking } from '../charts/BarangayRanking';
import { CommitDeliverScatter } from '../charts/CommitDeliverScatter';
import { TownTable } from '../charts/TownTable';
import { BarangayMap } from '../map/BarangayMap';
import { Row } from '../Row';
import { RowsSkeleton } from '../RowsSkeleton';

export function BarangaysView({
  barangays,
  loading,
}: {
  barangays: BarangayTotals[];
  loading: boolean;
}) {
  return (
    <Stack gap={4}>
      <AnalyticsPanel
        loading={loading}
        title="Pilot map"
        skeleton={<Skeleton height={440} radius="md" />}
        icon="location"
        note="Targeted barangays in the seven Laguna towns, shaded by delivered kW against their share of the target."
      >
        <BarangayMap barangays={barangays} />
      </AnalyticsPanel>
      <AnalyticsPanel
        loading={loading}
        title="Share of target by town"
        icon="barangay"
        note="Each tile is a targeted barangay, grouped by town. Delivered kW against its share of the target."
      >
        <BarangayHeatGrid barangays={barangays} />
      </AnalyticsPanel>
      <Row>
        <AnalyticsPanel
          loading={loading}
          title="Committed vs delivered"
          icon="chartLine"
          note="Below the line is commitment that was not verified. Point size is households."
          style={grow(480, 3)}
        >
          <CommitDeliverScatter barangays={barangays} />
        </AnalyticsPanel>
        <AnalyticsPanel
          loading={loading}
          title="Ranking"
          skeleton={<RowsSkeleton rows={10} />}
          icon="leaderboard"
          note="Share of target; the tick marks 100%."
          style={grow(420, 2)}
        >
          <BarangayRanking barangays={barangays} />
        </AnalyticsPanel>
      </Row>
      <AnalyticsPanel
        title="By town"
        icon="town"
        loading={loading}
        skeleton={<RowsSkeleton rows={7} />}
      >
        <TownTable barangays={barangays} />
      </AnalyticsPanel>
    </Stack>
  );
}
