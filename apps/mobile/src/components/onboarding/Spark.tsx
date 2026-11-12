import { themes } from '@kapitwatt/styles';
import { useRef, useState, type ComponentRef, type RefObject } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';

const c = themes.light.color;
const NATIVE = Platform.OS !== 'web';

/** How long the spark flies (ms). */
export const SPARK_MS = 560;

type Point = { x: number; y: number };
type Anchor = { ref: RefObject<ComponentRef<typeof View> | null>; offset: Point };

/** A dot of the spark and its trail: how far behind it runs, its size and its strength. */
const DOTS = [
  { lag: 0, size: 12, opacity: 1 },
  { lag: 0.1, size: 8, opacity: 0.6 },
  { lag: 0.2, size: 5, opacity: 0.35 },
] as const;

const where = (anchor: Anchor) =>
  new Promise<Point | null>((resolve) => {
    if (!anchor.ref.current) return resolve(null);
    anchor.ref.current.measureInWindow((x, y) =>
      resolve({ x: x + anchor.offset.x, y: y + anchor.offset.y }),
    );
  });

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

/** The spark in flight, over the whole screen. Across evenly, up fast then easing in: an arc. */
export function Spark({ t, path }: ReturnType<typeof useSpark>) {
  if (!path) return null;
  const { from, to } = path;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {DOTS.map((dot, i) => {
        const range = { inputRange: [dot.lag, 1 + dot.lag], extrapolate: 'clamp' as const };
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: -dot.size / 2,
              top: -dot.size / 2,
              width: dot.size,
              height: dot.size,
              borderRadius: dot.size / 2,
              backgroundColor: c.brandAccent,
              opacity: t.interpolate({
                inputRange: [0, 0.85, 1],
                outputRange: [dot.opacity, dot.opacity, 0],
              }),
              transform: [
                { translateX: t.interpolate({ ...range, outputRange: [from.x, to.x] }) },
                {
                  translateY: t.interpolate({
                    ...range,
                    outputRange: [from.y, to.y],
                    easing: Easing.out(Easing.cubic),
                  }),
                },
              ],
            }}
          />
        );
      })}
    </View>
  );
}
