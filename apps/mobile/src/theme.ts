/** Colours from the plan: navy = infrastructure, teal = real runtime, amber = demo-only / highlight. */
export const colors = {
  navy: '#0F2A43',
  teal: '#1B9AAA',
  amber: '#F5A623',
  green: '#2E8B57',
  red: '#D7263D',
  yellow: '#E8B10C',
  ink: '#0F2A43',
  muted: '#5B6B7B',
  border: '#D5DDE6',
  surface: '#EEF2F7',
  background: '#FFFFFF',
  onDark: '#FFFFFF',
} as const;

/** Spacing scale. Use these instead of raw numbers so screens line up. */
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { sm: 6, md: 10, lg: 16, pill: 999 } as const;

export const text = {
  caption: { fontSize: 13, lineHeight: 18 },
  body: { fontSize: 16, lineHeight: 22 },
  title: { fontSize: 20, lineHeight: 26, fontWeight: '700' },
  headline: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  /** Big numbers: countdowns, kW, PHP. */
  figure: { fontSize: 40, lineHeight: 46, fontWeight: '700', fontVariant: ['tabular-nums'] },
} as const;
