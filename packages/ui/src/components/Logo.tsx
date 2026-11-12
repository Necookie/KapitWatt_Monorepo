import { useTheme } from '@kapitwatt/hooks';
import type { ColorRoles } from '@kapitwatt/tokens';
import { Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { logoPaths, type LogoVariant } from '../logo-paths';

export type LogoProps = {
  /** lockup (symbol + wordmark, default), mark (symbol alone: small spaces), wordmark. */
  variant?: LogoVariant;
  /** Rendered height in dp; width follows the artwork. */
  height?: number;
  /** One colour only: `brand` on light grounds, `onBrand` on Grid Indigo. */
  color?: keyof ColorRoles;
};

/** The KapitWatt logo, drawn from the approved SVGs in @kapitwatt/assets. Never recolour beyond brand/onBrand. */
export function Logo({ variant = 'lockup', height = 32, color = 'brand' }: LogoProps) {
  const t = useTheme();
  const { viewBox, paths } = logoPaths[variant];
  const [, , w, h] = viewBox.split(' ').map(Number) as [number, number, number, number];
  // react-native-svg passes props straight to the DOM on the web: ARIA there, RN props on native.
  const a11y: Record<string, unknown> =
    Platform.OS === 'web'
      ? { role: 'img', 'aria-label': 'KapitWatt' }
      : { accessible: true, accessibilityRole: 'image', accessibilityLabel: 'KapitWatt' };
  return (
    <Svg width={(height * w) / h} height={height} viewBox={viewBox} fill={t.color[color]} {...a11y}>
      {paths.map((d, i) => (
        <Path key={i} d={d} fillRule="evenodd" />
      ))}
    </Svg>
  );
}
