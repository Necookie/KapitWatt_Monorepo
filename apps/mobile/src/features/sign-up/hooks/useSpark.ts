import { useRef, useState } from 'react';
import { Animated, Easing, Platform } from 'react-native';
import { SPARK_MS, where, type Anchor, type Point } from '../utils/spark';

const NATIVE = Platform.OS !== 'web';

/**
 * "Continue": a spark leaves Alitaptap's lantern and arcs up into the night to the next lantern.
 * `fly` measures both ends on screen, calls `launch` (the step changes as the spark leaves), starts
 * the flight on the next frame (after the new step has drawn, so it is never cut short), and calls
 * `land` when it arrives (the lantern lights). If an end cannot be measured: no spark, both at once.
 */
export function useSpark() {
  const t = useRef(new Animated.Value(0)).current;
  const [path, setPath] = useState<{ from: Point; to: Point } | null>(null);

  const fly = async (from: Anchor, to: Anchor, launch: () => void, land: () => void) => {
    const [a, b] = await Promise.all([where(from), where(to)]);
    launch();
    if (!a || !b) return land();
    t.setValue(0);
    setPath({ from: a, to: b });
    requestAnimationFrame(() =>
      Animated.timing(t, {
        toValue: 1,
        duration: SPARK_MS,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: NATIVE,
      }).start(({ finished }) => {
        // A flight cut short by the next Continue leaves the new spark alone.
        if (finished) setPath(null);
        land();
      }),
    );
  };

  return { t, path, fly };
}
