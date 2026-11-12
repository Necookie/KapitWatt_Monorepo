import { REWARD, type AlertAnalytics } from '@kapitwatt/shared';
import { Stack } from '@kapitwatt/ui';
import { count, fraction, percent, php } from '@/utils/format';
import { useOutcomeSegments } from '../../hooks/useOutcomeSegments';
import { grow } from '../../utils/layout';
import { AnalyticsPanel } from '../AnalyticsPanel';
import { Donut } from '../charts/Donut';
import { PathComparison } from '../charts/PathComparison';
import { VerificationFunnel } from '../charts/VerificationFunnel';
import { Row } from '../Row';

export function VerificationView({ a }: { a: AlertAnalytics }) {
  const settled = a.status === 'settled';
  const outcomes = useOutcomeSegments(a.outcomes);
  const verified = a.outcomes.find((o) => o.outcome === 'verified')?.households ?? 0;
  return (
    <Stack gap={4}>
      <Row>
        <AnalyticsPanel
          title="Verification funnel"
          icon="verified"
          note="Households at each step from commitment to a verified cut."
          style={grow(520, 3)}
        >
          <VerificationFunnel funnel={a.funnel} settled={settled} />
        </AnalyticsPanel>
        <AnalyticsPanel
          title="Outcomes"
          icon="flagged"
          note="What became of every commitment."
          style={grow(380, 2)}
        >
          <Donut
            segments={outcomes}
            center={percent(verified, a.committedHouseholds)}
            centerCaption="verified"
            format={(v) => count(v)}
            empty="No commitments yet."
          />
        </AnalyticsPanel>
      </Row>
      <AnalyticsPanel
        title="Smart meter vs photo"
        icon="smartMeter"
        note={`Photo households earn ${fraction(REWARD.pathMultiplier.photo)} of the rate; smart meters the full ${php(REWARD.ratePhpPerKwh)} per kWh (placeholders).`}
      >
        <PathComparison paths={a.paths} />
      </AnalyticsPanel>
    </Stack>
  );
}
