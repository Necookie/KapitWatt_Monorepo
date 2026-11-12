/** Spacing on a 4-unit grid. Keys are multiples of 4: space[4] = 16. */
export const space = {
  0: 0,
  0.5: 2,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export type Space = keyof typeof space;

/** Material 3 shape scale. Buttons and chips are `full`; cards `md`; sheets and dialogs `xl`. */
export const radius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 28,
  full: 9999,
} as const;

export type Radius = keyof typeof radius;

export const size = {
  /** Minimum touch target on any pressable. */
  touchTarget: 48,
  controlSm: 32,
  controlMd: 40,
  /** Primary actions in the household app, used outdoors and one-handed. */
  controlLg: 56,
  iconSm: 18,
  icon: 24,
  iconLg: 32,
} as const;

export const borderWidth = {
  hairline: 1,
  strong: 2,
  /** Focus ring: 2 wide, 2 clear of the control. */
  focus: 2,
  focusOffset: 2,
} as const;

/** Flat system: no shadows. Opacity of the state layer laid over a control's content colour. */
export const stateLayer = {
  hover: 0.08,
  focus: 0.1,
  pressed: 0.1,
  dragged: 0.16,
  disabledContent: 0.38,
  disabledContainer: 0.12,
} as const;

/** Material 3 window size classes (min width, dp). */
export const breakpoint = {
  compact: 0,
  medium: 600,
  expanded: 840,
  large: 1200,
  extraLarge: 1600,
} as const;

export type WindowClass = keyof typeof breakpoint;
