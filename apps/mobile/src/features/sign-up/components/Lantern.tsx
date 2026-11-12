import { themes } from '@kapitwatt/styles';
import { withAlpha } from '@kapitwatt/tokens';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import { Lantern as PaperLantern, LANTERN_ASPECT } from '@/components/night/Lantern';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { LANTERN } from '../utils/lantern-street';

const c = themes.light.color;
const NATIVE = Platform.OS !== 'web';

/**
 * One step's lantern on sign-up's street (the shared paper lantern): an outline until its step is
 * done, then lit with a little pop when the spark lands; the step you are on has a breathing ring.
 */
export function Lantern(props: {
  k: number;
  at: { x: number; top: number; y: number };
  lit: boolean;
  waiting: boolean;
}) {
  const { k, at } = props;
  const reduced = useReducedMotion();
  const on = useRef(new Animated.Value(props.lit ? 1 : 0)).current;
  const pop = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduced) return on.setValue(props.lit ? 1 : 0);
    if (!props.lit) {
      Animated.timing(on, { toValue: 0, duration: 220, useNativeDriver: NATIVE }).start();
      return;
    }
    pop.setValue(0);
    Animated.parallel([
      Animated.timing(on, { toValue: 1, duration: 120, useNativeDriver: NATIVE }),
      Animated.timing(pop, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.back(3)),
        useNativeDriver: NATIVE,
      }),
    ]).start();
  }, [props.lit]);

  // The lantern you are on now: its ring breathes, waiting for the spark.
  useEffect(() => {
    if (!props.waiting || reduced) return ring.setValue(props.waiting ? 1 : 0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(ring, { toValue: 1, duration: 700, useNativeDriver: NATIVE }),
        Animated.timing(ring, { toValue: 0.35, duration: 700, useNativeDriver: NATIVE }),
      ]),
    );
    ring.setValue(0.35);
    loop.start();
    return () => loop.stop();
  }, [props.waiting]);

  // A paper lantern (the shared drawing), its body centred where the circle used to be.
  const height = LANTERN * k * 1.4;
  const width = height * LANTERN_ASPECT;
  const left = at.x * k - width / 2;
  const top = at.y * k - height / 2;
  const ringSize = LANTERN * k + 10 * k;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View
        style={{
          position: 'absolute',
          left: at.x * k - 0.6,
          top: at.top * k,
          width: 1.2,
          height: Math.max(0, top - at.top * k + 1),
          backgroundColor: withAlpha(c.primaryContainer, 0.4),
        }}
      />
      {props.waiting ? (
        <Animated.View
          style={{
            position: 'absolute',
            left: at.x * k - ringSize / 2,
            top: at.y * k - ringSize / 2,
            width: ringSize,
            height: ringSize,
            borderRadius: ringSize / 2,
            borderWidth: 1.5,
            borderColor: c.brandAccent,
            opacity: ring,
          }}
        />
      ) : null}
      <View style={[styles.lantern, { left, top }]}>
        <PaperLantern height={height} state="unlit" ink={c.primaryContainer} />
      </View>
      <Animated.View
        style={[
          styles.lantern,
          {
            left,
            top,
            opacity: on,
            transform: [
              {
                scale: pop.interpolate({
                  inputRange: [0, 1],
                  outputRange: [props.lit ? 1 : 0.6, 1],
                }),
              },
            ],
          },
        ]}
      >
        <PaperLantern height={height} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  lantern: { position: 'absolute' },
});
