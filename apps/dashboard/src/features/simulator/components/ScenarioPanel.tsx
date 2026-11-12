import type { SimParams } from '@kapitwatt/shared';
import { Icon } from '@kapitwatt/icons';
import { DEFAULT_PARAMS } from '@kapitwatt/sim';
import { Button, Text } from '@kapitwatt/ui';
import { Panel } from '@/components/Panel';
import { count, kw } from '@/utils/format';
import { PLAN_TARGET_KW } from '../utils/plan-target';
import { ScenarioCards } from './ScenarioCards';

export function ScenarioPanel({
  params,
  setParams,
  set,
  targeted,
  targetKw,
  live,
}: {
  params: SimParams;
  setParams: (next: SimParams) => void;
  set: (patch: Partial<SimParams>) => void;
  targeted: number;
  targetKw: number;
  live: boolean;
}) {
  return (
    <Panel
      title="Scenario"
      subtitle={`For ${count(targeted)} households against ${kw(targetKw)} kW.`}
      aside={
        <Button
          label="Reset to plan defaults"
          variant="text"
          icon={<Icon name="refresh" size="sm" color="primary" />}
          onPress={() => setParams(DEFAULT_PARAMS)}
        />
      }
    >
      <ScenarioCards
        params={params}
        households={targeted}
        targetKw={targetKw}
        onPick={(participation) => set({ participation })}
      />
      <Text variant="bodySmall" color="onSurfaceVariant">
        Participation presets from the plan. Picking one changes participation only.
        {live
          ? ''
          : ` No alert is in force, so the plan target of ${kw(PLAN_TARGET_KW)} kW is used.`}
      </Text>
    </Panel>
  );
}
