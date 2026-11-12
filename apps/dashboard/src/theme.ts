/**
 * Light, compact, orange-led theme for the utility dashboard.
 *
 * Roles, not decoration:
 *  - `brand` marks identity and the primary action. `brandStrong` is the same hue dark
 *    enough for white text on it.
 *  - `series` colours carry data only. They are a validated set (colour-blind safe on
 *    the light surface); do not reorder them or reuse them for status.
 *  - `status` colours mean a state and always ship with a label.
 */
export const colors = {
  brand: '#E8650F',
  brandStrong: '#C4500A',
  brandSoft: '#FDEEE3',
  brandBorder: '#F6C9A6',

  ink: '#1F1A15',
  body: '#3D362E',
  muted: '#6F665C',
  faint: '#9A9187',

  background: '#F6F4F1',
  surface: '#FFFFFF',
  surfaceAlt: '#FAF8F6',
  border: '#E6E1DA',
  borderStrong: '#CFC8BE',
  track: '#EEEAE4',

  series: {
    committed: '#E8650F',
    deliveredAmi: '#2F6BE0',
    deliveredPhoto: '#00A08F',
  },

  status: {
    good: '#1B7F4B',
    goodSoft: '#E4F4EA',
    warning: '#8A6100',
    warningSoft: '#FFF3CC',
    critical: '#B42318',
    criticalSoft: '#FDE7E4',
    neutral: '#5F574E',
    neutralSoft: '#EEEAE4',
  },

  /** Kept for the Placeholder component. */
  amber: '#E8650F',
} as const;

export const font = {
  family:
    'Inter, "Segoe UI", system-ui, -apple-system, Roboto, "Helvetica Neue", Arial, sans-serif',
  /** Sizes in px. The base is small on purpose: this is a dense operator console. */
  xs: 11,
  sm: 12,
  md: 13,
  lg: 15,
  xl: 18,
  kpi: 26,
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;
export const radius = { sm: 4, md: 6, lg: 8 } as const;
