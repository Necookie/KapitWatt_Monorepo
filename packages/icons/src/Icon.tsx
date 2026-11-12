import { useTheme } from '@kapitwatt/hooks';
import type { ColorRoles } from '@kapitwatt/tokens';
import { Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { glyphs, type IconName, type IconWeight } from './glyphs';

/** react-native-svg hands props straight to the DOM <svg> on the web, so use ARIA there and RN props on native. */
function a11y(label: string | undefined): Record<string, unknown> {
  if (Platform.OS === 'web')
    return label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true };
  return label
    ? { accessible: true, accessibilityRole: 'image', accessibilityLabel: label }
    : { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' };
}

export type IconProps = {
  name: IconName;
  /** sm 18 (inline with text), md 24 (default), lg 32 (empty states, headers). */
  size?: 'sm' | 'md' | 'lg';
  /** A colour role, or a colour value when a parent already resolved its content colour (buttons, chips). */
  color?: keyof ColorRoles | (string & {});
  /** regular everywhere; fill for the selected tab or an active state; bold next to bold text. */
  weight?: IconWeight;
  /** Only when the icon alone says what a control does. Without it the icon is hidden from screen readers. */
  label?: string;
  /** Flip horizontally (back and forward arrows in right-to-left layouts). */
  mirrored?: boolean;
};

export function Icon({
  name,
  size = 'md',
  color = 'onSurface',
  weight = 'regular',
  label,
  mirrored,
}: IconProps) {
  const t = useTheme();
  const px = { sm: t.size.iconSm, md: t.size.icon, lg: t.size.iconLg }[size];
  const fill = color in t.color ? t.color[color as keyof ColorRoles] : color;
  return (
    <Svg
      width={px}
      height={px}
      viewBox="0 0 256 256"
      fill={fill}
      style={mirrored ? { transform: [{ scaleX: -1 }] } : undefined}
      {...a11y(label)}
    >
      {glyphs[name][weight].map((d, i) => (
        <Path key={i} d={d} />
      ))}
    </Svg>
  );
}
