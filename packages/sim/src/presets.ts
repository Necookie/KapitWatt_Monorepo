import { SimParams } from '@kapitwatt/shared';

/** Plan defaults: 60% participation, 80% follow-through, 15% smart meter, 90% photo completion. */
export const DEFAULT_PARAMS: SimParams = SimParams.parse({});

/** P1 presets: poor 30%, typical 60%, best 80% participation. */
export const PRESETS = {
  poor: { ...DEFAULT_PARAMS, participation: 0.3 },
  typical: DEFAULT_PARAMS,
  best: { ...DEFAULT_PARAMS, participation: 0.8 },
} satisfies Record<string, SimParams>;
export type PresetName = keyof typeof PRESETS;
