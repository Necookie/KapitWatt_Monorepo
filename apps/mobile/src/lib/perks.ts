import type { ContributionBand } from '@kapitwatt/shared';

const percent = (share: number) => `${Math.round(share * 100)}%`;

/** A band's perks in words, one per line. Empty for the paused band. The numbers are placeholders. */
export function perkLines(band: ContributionBand): string[] {
  if (band.extraPayDays === 0) return [];
  return [
    `${band.extraPayDays} extra days to pay your bill, no late fee`,
    `Bill deposit back after ${band.depositRefundMonths} months of on-time payment`,
    band.feeDiscount >= 1
      ? 'No reconnection or service fees'
      : `${percent(band.feeDiscount)} off reconnection and service fees`,
    `${percent(band.partnerDiscount)} off appliances at partner stores`,
    band.raffleEntries === 1
      ? '1 raffle entry a month'
      : `${band.raffleEntries} raffle entries a month`,
  ];
}

/** "+10", "−5" or "0": how an event moved the score. */
export const formatScoreChange = (delta: number) =>
  delta > 0 ? `+${delta}` : delta < 0 ? `−${Math.abs(delta)}` : '0';
