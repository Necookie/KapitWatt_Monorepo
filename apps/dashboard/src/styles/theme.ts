import { dataViz, fontFamily, light, radius as r, space as s } from '@kapitwatt/tokens';

/**
 * Bridge for the dashboard's older components (ui.tsx, charts, tables, forms) while each page moves to
 * @kapitwatt/ui. Every value here comes from @kapitwatt/tokens (light theme), so old and new parts of a
 * page share one palette and one typeface. New code should use the theme from `useTheme()` instead.
 *
 * Roles keep their meaning:
 *  - `brand*` is the primary action colour (Grid Indigo), not decoration.
 *  - `series` colours carry data only: committed = primary, delivered = relief teal (smart meter darker,
 *    meter photo lighter, told apart by lightness as well as label).
 *  - `status` colours mean a state and always ship with a label.
 */
export const colors = {
  brand: light.primary,
  brandStrong: light.primary,
  brandSoft: light.primaryContainer,
  brandBorder: light.outlineVariant,

  ink: light.onSurface,
  body: light.onSurface,
  muted: light.onSurfaceVariant,
  faint: light.outline,

  background: light.surface,
  surface: light.surfaceContainerLowest,
  surfaceAlt: light.surfaceContainerLow,
  border: light.outlineVariant,
  borderStrong: light.outline,
  track: light.surfaceContainerHighest,

  series: {
    committed: light.primary,
    deliveredAmi: dataViz.light.deliveredAmi,
    deliveredPhoto: dataViz.light.deliveredPhoto,
  },

  status: {
    good: light.onReliefContainer,
    goodSoft: light.reliefContainer,
    warning: light.onAlertYellowContainer,
    warningSoft: light.alertYellowContainer,
    critical: light.error,
    criticalSoft: light.errorContainer,
    neutral: light.onSurfaceVariant,
    neutralSoft: light.surfaceContainerHigh,
  },
} as const;

export const font = {
  /** Regular weight; `Txt` picks the family for other weights (React Native cannot synthesise them). */
  family: fontFamily.regular,
  /** Sizes in px. The base is small on purpose: this is a dense operator console. */
  xs: 11,
  sm: 12,
  md: 13,
  lg: 15,
  xl: 18,
  kpi: 26,
} as const;

/** Albert Sans family for a weight. */
export const familyFor = (weight: '400' | '500' | '600' | '700' = '400') =>
  ({
    '400': fontFamily.regular,
    '500': fontFamily.medium,
    '600': fontFamily.semibold,
    '700': fontFamily.bold,
  })[weight];

export const space = { xs: s[1], sm: s[2], md: s[3], lg: s[4], xl: s[6] } as const;
export const radius = { sm: r.xs, md: r.sm, lg: r.md } as const;
