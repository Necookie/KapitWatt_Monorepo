import type { ZeroPayoutReason } from '@kapitwatt/shared';
import { MascotHeader } from '@/components/mascot/MascotHeader';
import { formatKwh } from '@/utils/format';
import { ZERO_REASON } from '../utils/zero-reason';

/** The mascot celebrating the verified kWh, or saying why nothing was verified. */
export function ResultHeader(props: { zeroReason: ZeroPayoutReason | null; verifiedKwh: number }) {
  return props.zeroReason === null ? (
    <MascotHeader
      label="Your result"
      line={`You saved ${formatKwh(props.verifiedKwh)}!`}
      pose="reward"
      tone="reward"
    />
  ) : (
    <MascotHeader label="Your result" line={ZERO_REASON[props.zeroReason]} pose="missed" />
  );
}
