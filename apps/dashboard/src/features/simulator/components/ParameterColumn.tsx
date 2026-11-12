import type { SimParams } from '@kapitwatt/shared';
import { useTheme } from '@kapitwatt/hooks';
import { View } from 'react-native';
import { ParamGroups } from './ParamGroups';
import { ScenarioPanel } from './ScenarioPanel';

/** The scenario cards, then the assumptions in their groups. */
export function ParameterColumn({
  params,
  setParams,
  targeted,
  targetKw,
  live,
}: {
  params: SimParams;
  setParams: (next: SimParams) => void;
  targeted: number;
  targetKw: number;
  live: boolean;
}) {
  const t = useTheme();
  const set = (patch: Partial<SimParams>) => setParams({ ...params, ...patch });
  return (
    <View style={{ gap: t.space[4] }}>
      <ScenarioPanel
        params={params}
        setParams={setParams}
        set={set}
        targeted={targeted}
        targetKw={targetKw}
        live={live}
      />
      <ParamGroups params={params} set={set} />
    </View>
  );
}
