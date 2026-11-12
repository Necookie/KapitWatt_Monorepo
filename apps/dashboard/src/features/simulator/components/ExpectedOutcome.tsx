import type { SimParams } from '@kapitwatt/shared';
import type { ExpectedOutcome as Outcome } from '@kapitwatt/sim';
import { ReliefWaterfall } from '@/components/relief-waterfall/ReliefWaterfall';
import { kw } from '@/utils/format';

export function ExpectedOutcome({
  expected,
  targetKw,
  params,
}: {
  expected: Outcome;
  targetKw: number;
  params: SimParams;
}) {
  return (
    <ReliefWaterfall
      title="Expected outcome"
      subtitle={`Arithmetic only: households × participation × cut, then follow-through and photo completion. A real run lands near ${kw(Math.round(expected.deliveredKw))} kW, not on it.`}
      dense
      target={targetKw}
      committed={expected.committedKw}
      delivered={expected.deliveredKw}
      deliveredAmi={expected.deliveredAmiKw}
      deliveredPhoto={expected.deliveredPhotoKw}
      measured={false}
      params={params}
    />
  );
}
