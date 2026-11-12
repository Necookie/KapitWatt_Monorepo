import type { SimParams } from '@kapitwatt/shared';
import { Icon } from '@kapitwatt/icons';
import { DEFAULT_PARAMS } from '@kapitwatt/sim';
import { Button, TextField } from '@kapitwatt/ui';
import { useState } from 'react';
import { Panel } from '@/components/Panel';
import { spread } from '../utils/param-format';
import { ParamSlider } from './ParamSlider';
import { Sliders } from './Sliders';

export function RealismGroup({
  params,
  set,
}: {
  params: SimParams;
  set: (patch: Partial<SimParams>) => void;
}) {
  const [realism, setRealism] = useState(false);
  const d = DEFAULT_PARAMS;
  return (
    <Panel
      title="Realism"
      subtitle="Noise, pacing and the random seed. Rarely changed."
      aside={
        <Button
          label={realism ? 'Hide' : 'Show'}
          variant="text"
          icon={<Icon name={realism ? 'chevronUp' : 'chevronDown'} size="sm" color="primary" />}
          onPress={() => setRealism(!realism)}
        />
      }
    >
      {realism ? (
        <Sliders>
          {[
            <ParamSlider
              key="noise"
              label="Baseline noise"
              hint="How far a household's real load strays from its baseline."
              value={params.baselineNoise}
              defaultValue={d.baselineNoise}
              min={0}
              max={0.3}
              step={0.01}
              format={spread}
              onChange={(baselineNoise) => set({ baselineNoise })}
            />,
            <ParamSlider
              key="pace"
              label="Commit pacing"
              hint="Commits arrive over this long, so the live total rises gradually."
              value={params.paceSeconds}
              defaultValue={d.paceSeconds}
              min={0}
              max={60}
              step={5}
              format={(v) => `${v} s`}
              onChange={(paceSeconds) => set({ paceSeconds })}
            />,
            <TextField
              key="seed"
              label="Random seed"
              supportingText="The same seed gives the same run."
              inputMode="numeric"
              value={String(params.seed)}
              onChangeText={(text) => set({ seed: Number(text.replace(/\D/g, '')) || 0 })}
            />,
          ]}
        </Sliders>
      ) : null}
    </Panel>
  );
}
