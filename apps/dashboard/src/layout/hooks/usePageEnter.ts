import { duration } from '@kapitwatt/tokens';
import { usePathname } from 'expo-router';
import { useLayoutEffect, useRef, type ComponentRef } from 'react';
import type { View } from 'react-native';
import { curve, reducedMotion } from '@/styles/motion';

/**
 * Each new page fades in and rises 8 px. Run by the browser (Web Animations) on the page's box when
 * the path changes, before paint, so nothing remounts or re-renders for it.
 */
export function usePageEnter() {
  const ref = useRef<ComponentRef<typeof View>>(null);
  const path = usePathname();
  const first = useRef(true);
  useLayoutEffect(() => {
    // The first page arrives with the app; only navigation animates.
    if (first.current) {
      first.current = false;
      return;
    }
    const node = ref.current as unknown as HTMLElement | null;
    if (!node?.animate || reducedMotion()) return;
    node.animate(
      [
        { opacity: 0, transform: 'translateY(8px)' },
        { opacity: 1, transform: 'none' },
      ],
      { duration: duration.medium1, easing: curve.decelerate },
    );
  }, [path]);
  return ref;
}
