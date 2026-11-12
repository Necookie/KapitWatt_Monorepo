import type { SimParams } from '@kapitwatt/shared';
import { DEFAULT_PARAMS } from '@kapitwatt/sim';
import { Panel } from '@/components/Panel';
import { pct, spread } from '../utils/param-format';
import { ParamSlider } from './ParamSlider';
import { Sliders } from './Sliders';

export function HouseholdsGroup({
  params,
  set,
}: {
  params: SimParams;
  set: (patch: Partial<SimParams>) => void;
}) {
  const d = DEFAULT_PARAMS;
  return (
    <Panel title="Households" subtitle="Who takes part, and how much each one cuts.">
      <Sliders>
        {[
          <ParamSlider
            key="participation"
            label="Participation"
            hint="Share of households that commit."
            value={params.participation}
            defaultValue={d.participation}
            min={0.2}
            max={0.8}
            step={0.05}
            format={pct}
            onChange={(participation) => set({ participation })}
          />,
          <ParamSlider
            key="cut"
            label="Cut per household"
            hint="kW each participating household commits."
            value={params.cutKw}
            defaultValue={d.cutKw}
            min={0.5}
            max={2}
            step={0.5}
            format={(v) => `${v} kW`}
            onChange={(cutKw) => set({ cutKw })}
          />,
          <ParamSlider
            key="spread"
            label="Spread between barangays"
            hint="Variation in participation, so some barangays reach their target."
            value={params.barangaySpread}
            defaultValue={d.barangaySpread}
            min={0}
            max={0.5}
            step={0.05}
            format={spread}
            onChange={(barangaySpread) => set({ barangaySpread })}
          />,
        ]}
      </Sliders>
    </Panel>
  );
}
