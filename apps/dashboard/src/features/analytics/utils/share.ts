import type { BarangayTotals } from '@kapitwatt/shared';

/** A barangay's delivered kW as a share of its target (0 when it has no target). */
export const shareOf = (b: BarangayTotals) => (b.targetKw > 0 ? b.deliveredKw / b.targetKw : 0);
