import { useTheme } from '@kapitwatt/hooks';
import { withAlpha } from '@kapitwatt/tokens';

/**
 * Share-of-target colour scale, shared by the map and the heat grid: the relief role at 100% or
 * more, stepping up in opacity from 50% (shares cluster between 50% and 100%, so the scale spends
 * its range there).
 */
export function useShareShade() {
  const t = useTheme();
  return (share: number) =>
    share >= 1
      ? t.color.relief
      : withAlpha(t.color.relief, 0.1 + Math.min(1, Math.max(0, (share - 0.5) / 0.5)) * 0.6);
}
