import { Skeleton, Stack } from '@kapitwatt/ui';
import { grow } from '../../utils/layout';
import type { Tab } from '../../utils/views';
import { AnalyticsPanel } from '../AnalyticsPanel';
import { KpiCard } from '../KpiCard';
import { Row } from '../Row';
import { RowsSkeleton } from '../RowsSkeleton';

/** The view's layout in skeletons, with the real panel titles, while the alert loads. */
export function SkeletonView({ view }: { view: Tab }) {
  if (view === 'overview') {
    return (
      <Stack gap={4}>
        <Row>
          {(
            [
              ['Committed', 'commit'],
              ['Delivered', 'energy'],
              ['Participation', 'home'],
              ['On target', 'barangay'],
              ['Verified energy', 'verified'],
              ['Paid out', 'reward'],
            ] as const
          ).map(([label, icon]) => (
            <KpiCard key={label} label={label} icon={icon} loading />
          ))}
        </Row>
        <Row>
          <AnalyticsPanel
            title="Delivered against target"
            icon="chartBar"
            style={grow(300, 2)}
            loading
          />
          <AnalyticsPanel
            title="Delivered by verification path"
            icon="meter"
            style={grow(380, 3)}
            loading
          />
        </Row>
        <AnalyticsPanel title="Commitments over time" icon="chartLine" loading />
      </Stack>
    );
  }
  if (view === 'verification') {
    return (
      <Stack gap={4}>
        <Row>
          <AnalyticsPanel
            title="Verification funnel"
            icon="verified"
            style={grow(520, 3)}
            loading
            skeleton={<RowsSkeleton rows={4} />}
          />
          <AnalyticsPanel title="Outcomes" icon="flagged" style={grow(380, 2)} loading />
        </Row>
        <AnalyticsPanel
          title="Smart meter vs photo"
          icon="smartMeter"
          loading
          skeleton={<RowsSkeleton rows={3} />}
        />
      </Stack>
    );
  }
  if (view === 'barangays') {
    return (
      <Stack gap={4}>
        <AnalyticsPanel
          title="Pilot map"
          icon="location"
          loading
          skeleton={<Skeleton height={440} radius="md" />}
        />
        <AnalyticsPanel title="Share of target by town" icon="barangay" loading />
      </Stack>
    );
  }
  return null;
}
