import { COMMIT_PRESETS_KW } from '@kapitwatt/shared';
import { SegmentedButtons } from '@kapitwatt/ui';

/**
 * Quick picks: the preset cuts on the design system's segmented buttons (DESIGN.md names the commit
 * presets as their use); presets above the cap are disabled. A kW set with the stepper that is not
 * a preset leaves no segment selected.
 */
export function KwPresets(props: { selected: number; cap: number; onSet: (kw: number) => void }) {
  return (
    <SegmentedButtons
      size="lg"
      accessibilityLabel="Quick picks"
      segments={COMMIT_PRESETS_KW.map((kw) => ({
        value: String(kw),
        label: String(kw),
        disabled: kw > props.cap,
      }))}
      value={String(props.selected)}
      onChange={(kw) => props.onSet(Number(kw))}
    />
  );
}
