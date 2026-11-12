import { useTheme } from '@kapitwatt/hooks';

/**
 * Building blocks for the analytics views, on the design system only: theme colour roles and the
 * dataViz palette (committed = primary, delivered = relief, target = tertiary), the type scale,
 * the 4-unit spacing and the shape scale. Flat, no shadows. Every chart also states its numbers in
 * text, so nothing depends on colour alone.
 */

/** Chart colours, from the theme. Smart meter and photo are a split of delivered, so they get two
 *  related hues that never collide with the reserved alert, simulated or brand colours. */
export function useChartColors() {
  const t = useTheme();
  return {
    committed: t.dataViz.committed,
    delivered: t.dataViz.delivered,
    target: t.dataViz.target,
    baseline: t.dataViz.baseline,
    grid: t.dataViz.grid,
    area: t.dataViz.reliefArea,
    ami: t.color.secondary,
    photo: t.color.relief,
    ink: t.color.onSurface,
    muted: t.color.onSurfaceVariant,
    surface: t.color.surface,
    track: t.color.surfaceContainerHighest,
    error: t.color.error,
    errorSoft: t.color.errorContainer,
    pending: t.color.outline,
  };
}
