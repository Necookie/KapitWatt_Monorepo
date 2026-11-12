import { themes } from '@kapitwatt/styles';
import { fontFamily } from '@kapitwatt/tokens';

/**
 * The household app's styles, drawn from the shared design system (@kapitwatt/tokens via
 * @kapitwatt/styles, documented in DESIGN.md). The key names predate the design system and are
 * kept so existing screens keep working; each now maps to a Material 3 colour role.
 *
 * Prefer the design system directly in new code: `@kapitwatt/ui` components, and `useTheme()`
 * from `@kapitwatt/hooks` for roles not listed here. The household app ships light only.
 */
const t = themes.light;
const c = t.color;

export const colors = {
  /** Brand surfaces: the header bar. */
  navy: c.brand,
  /** Primary actions, selection, focus. (Was teal before the design system.) */
  teal: c.primary,
  /** Demo-only controls and simulated data. Pair with a dashed edge and the word "Simulated". */
  amber: c.simulated,
  /** Verified cuts, delivered kW, positive results. */
  green: c.relief,
  /** Errors in forms and failed checks. Not for NGCP alerts: use alertRed. */
  red: c.error,
  /** NGCP alert levels only; always shown with the level in words. */
  alertRed: c.alertRed,
  onAlertRed: c.onAlertRed,
  yellow: c.alertYellow,
  onAlertYellow: c.onAlertYellow,
  /** Points and rewards (Kuryente Orange). Never a warning. */
  reward: c.tertiary,
  /** Background behind reward icons and badges. */
  rewardContainer: c.tertiaryContainer,
  /** Background behind primary icons (icon tiles). */
  primaryContainer: c.primaryContainer,
  /** Grouped panels on the page (one tone up from the page, flat). */
  surfaceLow: c.surfaceContainerLow,
  ink: c.onSurface,
  muted: c.onSurfaceVariant,
  border: c.outlineVariant,
  /** Grouped content (cards); the same tone as `@kapitwatt/ui` filled cards. */
  surface: c.surfaceContainerHighest,
  /** The page. */
  background: c.surface,
  /** Text and icons on navy or teal fills. */
  onDark: c.onPrimary,
} as const;

/** Spacing on the 4-unit grid. */
export const space = {
  xs: t.space[1],
  sm: t.space[2],
  md: t.space[3],
  lg: t.space[4],
  xl: t.space[6],
  xxl: t.space[8],
} as const;

/** Material 3 shape scale. */
export const radius = {
  sm: t.radius.sm,
  md: t.radius.md,
  lg: t.radius.lg,
  pill: t.radius.full,
} as const;

/**
 * Albert Sans families. In React Native each weight is its own family: to make text heavier, set
 * `fontFamily: fonts.semibold`, never `fontWeight` (Android can fall back to the system font).
 */
export const fonts = fontFamily;

/**
 * Albert Sans type styles. Weight comes from the font family, so do not add `fontWeight` to these
 * (Android can fall back to the system font); pick a heavier style instead.
 */
export const text = {
  /** Notes and metadata. */
  caption: t.text.bodyMedium,
  /** Household body text never goes below body-large (16 px). */
  body: t.text.bodyLarge,
  /** Body text in Medium, for labels and emphasis inside a line. */
  label: t.text.titleMedium,
  title: t.text.titleLarge,
  headline: t.text.headlineMedium,
  /** Big numbers: countdowns, kW, PHP. Tabular digits. */
  figure: t.text.dataLarge,
} as const;
