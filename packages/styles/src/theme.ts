import type { TextStyle } from 'react-native';
import {
  borderWidth,
  breakpoint,
  color,
  dataViz,
  duration,
  easing,
  fontFamily,
  radius,
  size,
  space,
  stateLayer,
  typeScale,
  type ColorRoles,
  type ColorScheme,
  type TypeRole,
  type TypeStyle,
} from '@kapitwatt/tokens';

/** A token type style as a React Native text style. Weight comes from the family, never `fontWeight`
 *  (Android ignores fontWeight on custom families and can fall back to the system font). */
export function toTextStyle(style: TypeStyle): TextStyle {
  return {
    fontFamily: fontFamily[style.weight],
    fontSize: style.fontSize,
    lineHeight: style.lineHeight,
    letterSpacing: style.letterSpacing,
    ...(style.tabular ? { fontVariant: ['tabular-nums'] } : {}),
  };
}

const text = Object.fromEntries(
  Object.entries(typeScale).map(([role, s]) => [role, toTextStyle(s)]),
) as Record<TypeRole, TextStyle>;

export type Theme = {
  scheme: ColorScheme;
  color: ColorRoles;
  dataViz: (typeof dataViz)[ColorScheme];
  text: Record<TypeRole, TextStyle>;
  space: typeof space;
  radius: typeof radius;
  size: typeof size;
  borderWidth: typeof borderWidth;
  stateLayer: typeof stateLayer;
  breakpoint: typeof breakpoint;
  motion: { duration: typeof duration; easing: typeof easing };
};

export function createTheme(scheme: ColorScheme): Theme {
  return {
    scheme,
    color: color[scheme],
    dataViz: dataViz[scheme],
    text,
    space,
    radius,
    size,
    borderWidth,
    stateLayer,
    breakpoint,
    motion: { duration, easing },
  };
}

export const themes = { light: createTheme('light'), dark: createTheme('dark') } as const;
