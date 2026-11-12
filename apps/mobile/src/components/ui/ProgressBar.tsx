import { ProgressBar as DsProgressBar } from '@kapitwatt/ui';

/**
 * Barangay progress, drawn by `@kapitwatt/ui` (thick, relief teal for delivered kW).
 * 0..1 fills the bar; above 1 stays full (a barangay can beat its target).
 */
export function ProgressBar(props: { value: number; accessibilityLabel?: string }) {
  return (
    <DsProgressBar
      value={props.value}
      tone="relief"
      size="thick"
      accessibilityLabel={
        props.accessibilityLabel ?? `${Math.round(props.value * 100)}% of the target delivered`
      }
    />
  );
}
