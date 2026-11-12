/**
 * Appliance kW table for the optional appliance helper (P1): suggests what to
 * switch off to reach a committed cut. Estimates only. NOTHING IS PAID FROM THIS.
 * Rated kW values are rough placeholders.
 */
export const APPLIANCE_KW = {
  aircon_window_1hp: 1.0,
  aircon_split_1_5hp: 1.3,
  water_heater: 3.0,
  electric_stove: 1.5,
  flat_iron: 1.0,
  washing_machine: 0.5,
  rice_cooker: 0.7,
  refrigerator: 0.15,
  electric_fan: 0.07,
} as const;
export type ApplianceType = keyof typeof APPLIANCE_KW;

/** Smallest set of appliances (largest first) whose rated kW reaches the target cut. */
export function suggestAppliances(
  owned: readonly ApplianceType[],
  targetKw: number,
): ApplianceType[] {
  const picked: ApplianceType[] = [];
  let total = 0;
  for (const type of [...owned].sort((a, b) => APPLIANCE_KW[b] - APPLIANCE_KW[a])) {
    if (total >= targetKw) break;
    picked.push(type);
    total += APPLIANCE_KW[type];
  }
  return picked;
}
