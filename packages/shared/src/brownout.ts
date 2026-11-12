/**
 * Demo: wording for alerts with towns at risk of a brownout (simulated; KapitWatt has no feeder or
 * outage data). Every targeted household gets the same push; the dashboard writes the at-risk towns
 * into its default message, and the app shows the same line. Cutting anywhere lowers Meralco's
 * shortfall, so "help avoid it" is fair; never promise that a town keeps its power.
 */

/** Towns named in reading order: "Santa Cruz", "Santa Cruz and Pila", "Santa Cruz, Pila and Liliw". */
export function placeList(towns: readonly string[]): string {
  const list = [...new Set(towns)];
  if (list.length <= 1) return list[0] ?? '';
  return `${list.slice(0, -1).join(', ')} and ${list.at(-1)}`;
}

const isAre = (place: string) => (place.includes(' and ') ? 'are' : 'is');

export const brownoutCopy = {
  /** "Santa Cruz is at risk of a brownout tonight" (no "simulated": callers add it where needed). */
  atRisk: (place: string) => `${place} ${isAre(place)} at risk of a brownout tonight`,
  /** Alert card headline in the app. */
  headline: (place: string) => `Help avoid a brownout in ${place}`,
  /** Line in the app under the alert. */
  line: (place: string) => `${brownoutCopy.atRisk(place)}. Every cut helps avoid it.`,
};
