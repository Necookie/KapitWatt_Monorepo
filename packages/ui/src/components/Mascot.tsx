import { Platform } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { mascotXml, type MascotPose } from '../mascot-xml';

export type MascotProps = {
  /** neutral (home, onboarding), alert, dimmed (during the window), reward, missed (failed photo). */
  pose?: MascotPose;
  /** Rendered height in dp; width follows the artwork. */
  height?: number;
};

/**
 * Alitaptap, the KapitWatt firefly, for empty states and moments (never as the logo or an icon).
 * Decorative: hidden from screen readers; the text beside it carries the meaning.
 */
// react-native-svg hands props straight to the DOM on the web: aria-hidden there, RN props on native.
const hidden: Record<string, unknown> =
  Platform.OS === 'web'
    ? { 'aria-hidden': true }
    : { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' };

/** Every pose is traced in the same box (packages/assets/source/mascot.py): width over height. */
const ASPECT = 304 / 498;

export function Mascot({ pose = 'neutral', height = 120 }: MascotProps) {
  return <SvgXml xml={mascotXml[pose]} height={height} width={height * ASPECT} {...hidden} />;
}
