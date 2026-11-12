/** A Filipino greeting for the time of day on the phone (decorative; nothing depends on it). */
export function greeting(now = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return 'Magandang umaga!';
  if (hour < 18) return 'Magandang hapon!';
  return 'Magandang gabi!';
}
