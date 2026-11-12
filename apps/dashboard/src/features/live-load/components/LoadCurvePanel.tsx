import type { SimParams } from '@kapitwatt/shared';
import { useTheme } from '@kapitwatt/hooks';
import { Text } from '@kapitwatt/ui';
import { View } from 'react-native';
import { Legend } from '@/components/Legend';
import { Panel } from '@/components/Panel';
import { fraction } from '@/utils/format';
import { LoadCurve } from './LoadCurve';

/** The load curve in its panel, with the legend in the header and the forecast's assumptions. */
export function LoadCurvePanel({
  windowStart,
  windowEnd,
  baselineKw,
  forecastKw,
  deliveredKw,
  measured,
  params,
}: {
  windowStart: string;
  windowEnd: string;
  baselineKw?: number;
  forecastKw: number;
  deliveredKw: number;
  measured: boolean;
  params: SimParams;
}) {
  const t = useTheme();
  const photoFollowThrough = params.photoFollowThrough ?? params.followThrough;
  return (
    <Panel
      title="Load curve"
      subtitle="Committed households, averaged over the window."
      style={{ flex: 1 }}
      aside={
        <Legend
          items={[
            { color: t.color.onSurfaceVariant, label: 'Baseline' },
            { color: t.dataViz.committed, label: 'Forecast', outline: true },
            { color: t.dataViz.deliveredPhoto, label: 'Verified' },
          ]}
        />
      }
    >
      <View style={{ gap: t.space[3] }}>
        <LoadCurve
          windowStart={windowStart}
          windowEnd={windowEnd}
          baselineKw={baselineKw}
          forecastKw={forecastKw}
          deliveredKw={deliveredKw}
          measured={measured}
          legend={false}
        />
        <Text variant="bodySmall" color="onSurfaceVariant">
          One verified figure per household, not a 5-minute curve. Forecast = committed ×
          follow-through ({fraction(params.followThrough)} smart, {fraction(photoFollowThrough)}{' '}
          photo), less missed photos ({fraction(1 - params.photoCompletion)}).
        </Text>
      </View>
    </Panel>
  );
}
