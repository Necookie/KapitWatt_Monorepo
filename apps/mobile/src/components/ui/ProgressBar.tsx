import { ProgressBar as DsProgressBar } from '@kapitwatt/ui';

/**
 * Barangay progress, drawn by `@kapitwatt/ui` (thick). Tones follow DESIGN.md's chart roles:
 * delivered kW in relief teal (the default), committed kW in primary.
 * 0..1 fills the bar; above 1 stays full (a barangay can beat its target).
 */
export function ProgressBar(props: {
  value: number;
  tone?: 'relief' | 'primary';
  accessibilityLabel?: string;
}) {
  return (
    <DsProgressBar
      value={props.value}
      tone={props.tone ?? 'relief'}
      size="thick"
      accessibilityLabel={
        props.accessibilityLabel ?? `${Math.round(props.value * 100)}% of the target delivered`
      }
    />
  );
}
