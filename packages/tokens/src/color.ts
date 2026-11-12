import { palette } from './palette';

const { indigo, indigoMuted, orange, red, yellow, teal, neutral: n, neutralVariant: nv } = palette;

/**
 * Colour roles, Material 3 naming plus KapitWatt's own signal roles.
 * Every `onX` is the text and icon colour for an `X` fill; tests check each pair for contrast.
 *
 * Reserved meanings (never use these hues for anything else):
 *   alertRed / alertYellow  NGCP red and yellow alerts. Always shown with the word and an icon.
 *   relief                  verified, delivered kW, positive results
 *   simulated               anything produced by the simulator (pair it with a dashed border and "Simulated")
 * Orange (tertiary, brandAccent) is the brand's warmth: rewards, points, highlights. Never a warning.
 */
export type ColorRoles = {
  /** Logo colour, app bars and brand moments. */
  brand: string;
  onBrand: string;
  /** Kuryente Orange as a fill: points, badges, highlights. Text on it is dark. */
  brandAccent: string;
  onBrandAccent: string;

  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;

  alertRed: string;
  onAlertRed: string;
  alertRedContainer: string;
  onAlertRedContainer: string;
  alertYellow: string;
  onAlertYellow: string;
  alertYellowContainer: string;
  onAlertYellowContainer: string;
  relief: string;
  onRelief: string;
  reliefContainer: string;
  onReliefContainer: string;
  simulated: string;
  simulatedContainer: string;
  onSimulatedContainer: string;

  /** Flat UI: surfaces step by tone, not by shadow. */
  surface: string;
  surfaceDim: string;
  surfaceBright: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  onSurface: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;
  focusRing: string;
  scrim: string;
};

export const light: ColorRoles = {
  brand: indigo[20],
  onBrand: indigo[100],
  brandAccent: '#F95D28',
  onBrandAccent: orange[10],

  // Primary sits one tone deeper than stock M3 (30, not 40) so actions carry the brand's weight.
  primary: indigo[30],
  onPrimary: indigo[100],
  primaryContainer: indigo[90],
  onPrimaryContainer: indigo[10],
  secondary: indigoMuted[40],
  onSecondary: indigoMuted[100],
  secondaryContainer: indigoMuted[90],
  onSecondaryContainer: indigoMuted[10],
  tertiary: orange[40],
  onTertiary: orange[100],
  tertiaryContainer: orange[90],
  onTertiaryContainer: orange[10],
  error: red[40],
  onError: red[100],
  errorContainer: red[90],
  onErrorContainer: red[10],

  alertRed: red[40],
  onAlertRed: red[100],
  alertRedContainer: red[90],
  onAlertRedContainer: red[10],
  alertYellow: yellow[80],
  onAlertYellow: yellow[10],
  alertYellowContainer: yellow[90],
  onAlertYellowContainer: yellow[10],
  relief: teal[40],
  onRelief: teal[100],
  reliefContainer: teal[90],
  onReliefContainer: teal[10],
  simulated: nv[40],
  simulatedContainer: nv[90],
  onSimulatedContainer: nv[10],

  surface: n[98],
  surfaceDim: n[87],
  surfaceBright: n[98],
  surfaceContainerLowest: n[100],
  surfaceContainerLow: n[96],
  surfaceContainer: n[94],
  surfaceContainerHigh: n[92],
  surfaceContainerHighest: n[90],
  onSurface: n[10],
  onSurfaceVariant: nv[30],
  outline: nv[50],
  outlineVariant: nv[80],
  inverseSurface: n[20],
  inverseOnSurface: n[95],
  inversePrimary: indigo[80],
  focusRing: indigo[40],
  scrim: n[0],
};

export const dark: ColorRoles = {
  brand: indigo[20],
  onBrand: indigo[100],
  brandAccent: '#F95D28',
  onBrandAccent: orange[10],

  primary: indigo[80],
  onPrimary: indigo[20],
  primaryContainer: indigo[30],
  onPrimaryContainer: indigo[90],
  secondary: indigoMuted[80],
  onSecondary: indigoMuted[20],
  secondaryContainer: indigoMuted[30],
  onSecondaryContainer: indigoMuted[90],
  tertiary: orange[80],
  onTertiary: orange[20],
  tertiaryContainer: orange[30],
  onTertiaryContainer: orange[90],
  error: red[80],
  onError: red[20],
  errorContainer: red[30],
  onErrorContainer: red[90],

  alertRed: red[80],
  onAlertRed: red[20],
  alertRedContainer: red[30],
  onAlertRedContainer: red[90],
  alertYellow: yellow[80],
  onAlertYellow: yellow[10],
  alertYellowContainer: yellow[30],
  onAlertYellowContainer: yellow[90],
  relief: teal[80],
  onRelief: teal[20],
  reliefContainer: teal[30],
  onReliefContainer: teal[90],
  simulated: nv[70],
  simulatedContainer: nv[30],
  onSimulatedContainer: nv[90],

  surface: n[6],
  surfaceDim: n[6],
  surfaceBright: n[24],
  surfaceContainerLowest: n[4],
  surfaceContainerLow: n[10],
  surfaceContainer: n[12],
  surfaceContainerHigh: n[17],
  surfaceContainerHighest: n[22],
  onSurface: n[90],
  onSurfaceVariant: nv[80],
  outline: nv[60],
  outlineVariant: nv[30],
  inverseSurface: n[90],
  inverseOnSurface: n[20],
  inversePrimary: indigo[40],
  focusRing: indigo[80],
  scrim: n[0],
};

export const color = { light, dark } as const;
export type ColorScheme = keyof typeof color;

/** Chart series. Same meaning on the dashboard and in the app. */
export const dataViz = {
  light: {
    committed: light.primary,
    delivered: light.relief,
    target: light.tertiary,
    baseline: light.outline,
    reliefArea: light.reliefContainer,
    simulated: light.simulated,
    grid: light.outlineVariant,
  },
  dark: {
    committed: dark.primary,
    delivered: dark.relief,
    target: dark.tertiary,
    baseline: dark.outline,
    reliefArea: dark.reliefContainer,
    simulated: dark.simulated,
    grid: dark.outlineVariant,
  },
} as const;
