import {
  REWARD,
  type AlertAnalytics,
  type AlertHistoryItem,
  type SimParams,
} from '@kapitwatt/shared';
import { Stack } from '@kapitwatt/ui';
import { grow } from '../../utils/layout';
import { AnalyticsPanel } from '../AnalyticsPanel';
import { AlertHistoryBars } from '../charts/AlertHistoryBars';
import { CostPerKwhTrend } from '../charts/CostPerKwhTrend';
import { SmartMeterWhatIf } from '../charts/SmartMeterWhatIf';
import { Empty } from '../Empty';
import { Row } from '../Row';

export function TrendsView({
  alerts,
  historyLoading,
  selected,
  onSelect,
  a,
  forecastLoading,
  households,
  simParams,
}: {
  alerts: AlertHistoryItem[];
  historyLoading: boolean;
  selected?: string;
  onSelect: (alertId: string) => void;
  a?: AlertAnalytics;
  forecastLoading: boolean;
  households: number;
  simParams: SimParams;
}) {
  return (
    <Stack gap={4}>
      <AnalyticsPanel
        loading={historyLoading}
        title="Recent alerts"
        icon="history"
        note="Select an alert to analyse it in the other views."
      >
        <AlertHistoryBars alerts={alerts} selected={selected} onSelect={onSelect} />
      </AnalyticsPanel>
      <Row>
        <AnalyticsPanel
          title="Cost per verified kWh"
          icon="reward"
          style={grow(420)}
          loading={historyLoading}
        >
          <CostPerKwhTrend alerts={alerts} rate={REWARD.ratePhpPerKwh} />
        </AnalyticsPanel>
        <AnalyticsPanel
          title="What if more households had smart meters?"
          loading={forecastLoading}
          icon="smartMeter"
          style={grow(420)}
        >
          {households > 0 && a ? (
            <SmartMeterWhatIf households={households} params={simParams} targetKw={a.targetKw} />
          ) : (
            <Empty>Seed the simulator to see the forecast.</Empty>
          )}
        </AnalyticsPanel>
      </Row>
    </Stack>
  );
}
