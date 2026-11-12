import { useTheme } from '@kapitwatt/hooks';
import { TileStack } from '@/components/TileStack';
import { kw, percent } from '@/utils/format';

/**
 * The figures beside the alert hero: committed leads; forecast (an assumption) and verified delivery
 * sit beneath it. The target is in the hero.
 */
export function FigureTiles({
  target,
  committed,
  forecast,
  delivered,
  measured,
  barangays,
  barangaysHit,
}: {
  target: number;
  committed: number;
  forecast: number;
  delivered: number;
  measured: boolean;
  barangays: number;
  barangaysHit: number;
}) {
  const t = useTheme();
  const c = t.color;
  return (
    <TileStack
      lead={{
        label: 'Committed',
        icon: 'commit',
        value: kw(Math.round(committed)),
        note: `${percent(committed, target)} of the ${kw(target)} kW target`,
        progress: {
          value: committed / Math.max(target, committed, 1),
          target: target / Math.max(target, committed, 1),
          label: 'Committed against the target',
        },
        bg: c.primaryContainer,
        fg: c.onPrimaryContainer,
      }}
      pair={[
        {
          label: 'Forecast',
          icon: 'chartLine',
          value: kw(Math.round(forecast)),
          note: `Assumption · ${percent(forecast, target)}`,
          bg: c.surfaceContainerLowest,
          fg: c.onSurface,
          dashed: true,
        },
        {
          label: 'Delivered',
          icon: 'verified',
          value: measured ? kw(Math.round(delivered)) : undefined,
          note: measured ? `${barangaysHit} of ${barangays} on target` : 'After the window',
          bg: measured ? c.reliefContainer : c.surfaceContainer,
          fg: measured ? c.onReliefContainer : c.onSurfaceVariant,
        },
      ]}
    />
  );
}
