import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform } from 'react-native';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * How dark the band's street is (0 all lit, 1 all dark), easing to `share` whenever it changes: the
 * windows go out one after another as the household raises its cut, like the welcome try-it.
 */
export function useStreetDim(share: number) {
  const reduced = useReducedMotion();
  const dim = useRef(new Animated.Value(share)).current;
  useEffect(() => {
    const to = Math.min(1, Math.max(0, share));
    if (reduced) return dim.setValue(to);
    Animated.timing(dim, {
      toValue: to,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      // The windows' opacity follows this value through interpolation (Skyline).
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [share, reduced, dim]);
  return dim;
}
