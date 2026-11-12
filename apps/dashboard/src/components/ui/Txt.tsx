import { Text, type TextProps, type TextStyle } from 'react-native';
import { colors, familyFor, font } from '@/styles/theme';

type Tone = 'body' | 'ink' | 'muted' | 'faint';

/** Text in the compact legacy scale used by the older screens. */
export function Txt({
  tone = 'body',
  size = 'md',
  weight,
  numeric,
  style,
  ...rest
}: TextProps & {
  tone?: Tone;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'kpi';
  weight?: '400' | '500' | '600' | '700';
  /** Tabular figures, so columns of numbers line up. */
  numeric?: boolean;
}) {
  // The weight is the font family (Albert Sans per weight); fontWeight would synthesise a fake bold.
  const base: TextStyle = {
    fontFamily: familyFor(weight),
    fontSize: font[size],
    color: colors[tone],
    ...(numeric ? { fontVariant: ['tabular-nums'] } : null),
  };
  return <Text {...rest} style={[base, style]} />;
}
