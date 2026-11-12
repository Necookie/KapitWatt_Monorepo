import { useTheme } from '@kapitwatt/hooks';
import { type ViewStyle } from 'react-native';
import { bezier } from '@/styles/motion';

/**
 * Web-only CSS transition (the dashboard ships to the web): the browser animates it, no per-frame
 * JavaScript. One curve (M3 standard) and one duration both ways, so collapse and expand feel alike.
 */
export function useNavMotion() {
  const { duration, easing } = useTheme().motion;
  const ease = bezier(easing.standard);
  return {
    /** The edge and the item highlights. */
    size: (props: string) =>
      ({
        transitionProperty: props,
        transitionDuration: `${duration.medium2}ms`,
        transitionTimingFunction: ease,
      }) as unknown as ViewStyle,
    /** Labels: out fast on collapse; in on expand once there is room for them. */
    fade: (visible: boolean) =>
      ({
        opacity: visible ? 1 : 0,
        transitionProperty: 'opacity',
        transitionDuration: `${duration.short3}ms`,
        transitionTimingFunction: ease,
        transitionDelay: visible ? `${duration.short3}ms` : '0ms',
      }) as unknown as ViewStyle,
  };
}
