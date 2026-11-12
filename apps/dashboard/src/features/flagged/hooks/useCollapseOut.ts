import { duration } from '@kapitwatt/tokens';
import { useLayoutEffect, useRef, type ComponentRef } from 'react';
import type { View } from 'react-native';
import { curve, reducedMotion } from '@/styles/motion';

/**
 * Collapses a list item out once `leaving` turns on: its height, the list gap after it and its
 * opacity run to nothing (Web Animations, held at the end), so the items below move up into its
 * place before the refetched list drops it.
 */
export function useCollapseOut(leaving: boolean, gap: number) {
  const ref = useRef<ComponentRef<typeof View>>(null);
  useLayoutEffect(() => {
    const node = ref.current as unknown as HTMLElement | null;
    if (!leaving || !node?.animate) return;
    node.style.overflow = 'hidden';
    node.animate(
      [
        { height: `${node.offsetHeight}px`, opacity: 1, marginBottom: '0px' },
        { height: '0px', opacity: 0, marginBottom: `${-gap}px` },
      ],
      {
        duration: reducedMotion() ? 1 : duration.medium2,
        easing: curve.standard,
        fill: 'forwards',
      },
    );
  }, [leaving, gap]);
  return ref;
}
