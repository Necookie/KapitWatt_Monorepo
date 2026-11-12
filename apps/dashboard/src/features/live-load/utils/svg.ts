import { Platform } from 'react-native';

/** Decorative SVG: hidden from assistive tech (ARIA on web, RN props on native). */
export const svgHidden: Record<string, unknown> =
  Platform.OS === 'web'
    ? { 'aria-hidden': true }
    : { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' };
