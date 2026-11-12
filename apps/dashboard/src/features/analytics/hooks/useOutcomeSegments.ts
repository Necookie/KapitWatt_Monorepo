import type { AlertAnalytics, AnalyticsOutcome } from '@kapitwatt/shared';
import { withAlpha } from '@kapitwatt/tokens';
import type { DonutSegment } from '../components/charts/Donut';
import { useChartColors } from './useChartColors';

/** What became of every commitment. Failures use the error role; nothing reuses the alert colours. */
export function useOutcomeSegments(outcomes: AlertAnalytics['outcomes']): DonutSegment[] {
  const c = useChartColors();
  const spec: Record<AnalyticsOutcome, { label: string; color: string }> = {
    verified: { label: 'Verified', color: c.delivered },
    awaiting_settlement: { label: 'Awaiting settlement', color: c.committed },
    pending_review: { label: 'Held for review', color: c.ami },
    missing_photo: { label: 'Missing photo', color: c.error },
    late_photo: { label: 'Late photo', color: withAlpha(c.error, 0.7) },
    failed_check: { label: 'Failed a check', color: withAlpha(c.error, 0.45) },
    no_measured_cut: { label: 'No measured cut', color: c.pending },
    missing_ami_data: { label: 'Missing meter data', color: withAlpha(c.pending, 0.6) },
  };
  const order = Object.keys(spec) as AnalyticsOutcome[];
  return [...outcomes]
    .sort((a, b) => order.indexOf(a.outcome) - order.indexOf(b.outcome))
    .map((o) => ({
      label: spec[o.outcome].label,
      value: o.households,
      color: spec[o.outcome].color,
    }));
}
