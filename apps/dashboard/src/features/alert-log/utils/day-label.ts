/** "Today, Nov 12", "Yesterday, Nov 11", or "Mon, Nov 10". */
export function dayLabel(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
  const midnight = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((midnight(new Date()) - midnight(d)) / 86_400_000);
  if (days === 0) return `Today, ${date}`;
  if (days === 1) return `Yesterday, ${date}`;
  return `${d.toLocaleDateString('en-PH', { weekday: 'short' })}, ${date}`;
}
