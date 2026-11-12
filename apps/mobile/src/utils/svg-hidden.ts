import { Platform } from 'react-native';

/**
 * Hides a decorative react-native-svg drawing from screen readers. react-native-svg hands props to
 * the DOM on the web, so ARIA there; React Native's own props on the phone.
 */
export const svgHidden: Record<string, unknown> =
  Platform.OS === 'web'
    ? { 'aria-hidden': true }
    : { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' };
