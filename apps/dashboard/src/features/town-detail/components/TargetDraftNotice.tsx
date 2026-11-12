import { Notice } from '@/components/ui/Notice';
import { kw } from '@/utils/format';

interface Props {
  invalid: boolean;
  /** The alert's overall target, kW. */
  alertTargetKw: number;
  /** The barangay targets summed across the alert with the edits applied, kW. */
  allTargets: number;
}

export function TargetDraftNotice({ invalid, alertTargetKw, allTargets }: Props) {
  return (
    <Notice tone={invalid ? 'warning' : 'neutral'}>
      {invalid
        ? 'Enter a target from 0 to 1,000,000 kW for each barangay.'
        : `An override changes that barangay's share only. The alert asks for ${kw(
            alertTargetKw,
          )} kW in all; the barangay targets would add up to ${kw(
            Math.round(allTargets * 10) / 10,
          )} kW.`}
    </Notice>
  );
}
