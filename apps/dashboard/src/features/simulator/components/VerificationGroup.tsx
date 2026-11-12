import type { SimParams } from '@kapitwatt/shared';
import { DEFAULT_PARAMS } from '@kapitwatt/sim';
import { Panel } from '@/components/Panel';
import { pct } from '../utils/param-format';
import { ParamSlider } from './ParamSlider';
import { Sliders } from './Sliders';

export function VerificationGroup({
  params,
  set,
}: {
  params: SimParams;
  set: (patch: Partial<SimParams>) => void;
}) {
  const d = DEFAULT_PARAMS;
  return (
    <Panel title="Verification" subtitle="How committed kW turns into verified kW.">
      <Sliders>
        {[
          <ParamSlider
            key="ami"
            label="Smart-meter share"
            hint={`The rest (${pct(1 - params.amiShare)}) verify by meter photo. Applied when you seed.`}
            value={params.amiShare}
            defaultValue={d.amiShare}
            min={0}
            max={1}
            step={0.05}
            format={pct}
            onChange={(amiShare) => set({ amiShare })}
          />,
          <ParamSlider
            key="ft"
            label="Follow-through, smart meter"
            hint="Share of the committed cut smart-meter households deliver."
            value={params.followThrough}
            defaultValue={d.followThrough}
            min={0}
            max={1}
            step={0.05}
            format={pct}
            onChange={(followThrough) => set({ followThrough })}
          />,
          <ParamSlider
            key="ftPhoto"
            label="Follow-through, meter photo"
            hint={
              params.photoFollowThrough === undefined
                ? 'Same as smart meter until you move it.'
                : 'Share of the committed cut photo households deliver.'
            }
            value={params.photoFollowThrough ?? params.followThrough}
            defaultValue={d.photoFollowThrough ?? d.followThrough}
            min={0}
            max={1}
            step={0.05}
            format={pct}
            onChange={(photoFollowThrough) => set({ photoFollowThrough })}
          />,
          <ParamSlider
            key="completion"
            label="Photo completion"
            hint="Photo households that send both photos on time."
            value={params.photoCompletion}
            defaultValue={d.photoCompletion}
            min={0}
            max={1}
            step={0.05}
            format={pct}
            onChange={(photoCompletion) => set({ photoCompletion })}
          />,
        ]}
      </Sliders>
    </Panel>
  );
}
