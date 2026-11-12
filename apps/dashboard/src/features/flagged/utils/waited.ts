/** "18 min", "2 h 5 min": how long the oldest reading has waited for a person. */
export function waited(fromIso: string): string {
  const min = Math.max(0, Math.round((Date.now() - new Date(fromIso).getTime()) / 60_000));
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  return min % 60 ? `${h} h ${min % 60} min` : `${h} h`;
}
