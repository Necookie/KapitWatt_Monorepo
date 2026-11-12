import { themes } from '@kapitwatt/styles';
import { withAlpha } from '@kapitwatt/tokens';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { LANTERN } from '../utils/lantern-street';

const c = themes.light.color;
const NATIVE = Platform.OS !== 'web';

/** A round lantern like Alitaptap's tail: Kuryente Orange with warm ribs when lit, dim when not. */
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

  const size = LANTERN * k;
  const left = at.x * k - size / 2;
  const top = at.y * k - size / 2;
  const ringSize = size + 8 * k;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View
        style={{
          position: 'absolute',
          left: at.x * k - 0.6,
          top: at.top * k,
          width: 1.2,
          height: (at.y - at.top) * k - size / 2 + 1,
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
      <View
        style={[
          styles.lantern,
          {
            left,
            top,
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: withAlpha(c.primaryContainer, 0.16),
            borderWidth: 1,
            borderColor: withAlpha(c.primaryContainer, 0.5),
          },
        ]}
      >
        <View
          style={[
            styles.rib,
            styles.ribDim,
            { left: size * 0.3, top: size * 0.14, height: size * 0.72 },
          ]}
        />
        <View
          style={[
            styles.rib,
            styles.ribDim,
            { left: size * 0.62, top: size * 0.14, height: size * 0.72 },
          ]}
        />
      </View>
      <Animated.View
        style={[
          styles.lantern,
          {
            left,
            top,
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: c.brandAccent,
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
        <View style={[styles.rib, { left: size * 0.3, top: size * 0.14, height: size * 0.72 }]} />
        <View style={[styles.rib, { left: size * 0.62, top: size * 0.14, height: size * 0.72 }]} />
      </Animated.View>
      <View
        style={{
          position: 'absolute',
          left: at.x * k - size * 0.22,
          top: top - 1.5 * k,
          width: size * 0.44,
          height: 3 * k,
          borderRadius: 1,
          backgroundColor: c.onPrimaryContainer,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  lantern: { position: 'absolute', overflow: 'hidden' },
  rib: {
    position: 'absolute',
    width: 1.2,
    borderRadius: 1,
    backgroundColor: c.tertiaryContainer,
  },
  ribDim: { backgroundColor: withAlpha(c.primaryContainer, 0.3) },
});
