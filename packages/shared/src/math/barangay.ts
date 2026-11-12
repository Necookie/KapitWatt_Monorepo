/**
 * The alert's target kW is split across the targeted barangays in proportion to
 * their opted-in households. (The operator can override a barangay's share; apply
 * overrides after this.)
 */
export function splitTargetKw(
  targetKw: number,
  optedInByBarangay: Readonly<Record<string, number>>,
): Record<string, number> {
  const total = Object.values(optedInByBarangay).reduce((a, b) => a + b, 0);
  const out: Record<string, number> = {};
  for (const [barangayId, count] of Object.entries(optedInByBarangay)) {
    out[barangayId] = total === 0 ? 0 : (targetKw * count) / total;
  }
  return out;
}

/** Progress = verified delivered kW / barangay target. The bonus triggers at 100% at settlement. */
export function barangayProgress(deliveredKw: number, targetKw: number): number {
  return targetKw <= 0 ? 0 : deliveredKw / targetKw;
}

export function barangayTargetHit(deliveredKw: number, targetKw: number): boolean {
  return targetKw > 0 && deliveredKw >= targetKw;
}
