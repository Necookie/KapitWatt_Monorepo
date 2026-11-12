import { themes } from '@kapitwatt/styles';
import type { MascotPose } from '@kapitwatt/ui';
import { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { svgHidden } from '@/utils/svg-hidden';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { mascotLayers } from '@/components/mascot/layers';
import { ARMS, BOX, BURST_FROM, PERSONALITY, WING_ROOT } from '@/components/mascot/personality';

const c = themes.light.color;
const NATIVE = Platform.OS !== 'web';

const ease = Easing.inOut(Easing.sin);
const go = (value: Animated.Value, toValue: number, duration: number, easing = ease) =>
  Animated.timing(value, { toValue, duration, easing, useNativeDriver: NATIVE });
/** Up and back, again and again. */
const wave = (value: Animated.Value, ms: number) =>
  Animated.loop(Animated.sequence([go(value, 1, ms), go(value, 0, ms)]));
const between = ([a, b]: readonly [number, number]) => a + Math.random() * (b - a);

/**
 * Alitaptap, alive: the traced pose split into layers that move on their own. It floats and
 * breathes, leans, blinks (twice now and then) and flutters or buzzes its wings; each pose has its
 * own temper (PERSONALITY). It squashes into every new pose, hops when
 * tapped (`pokeable`), and trembles with its wings buzzing while `excited`. Its hands move on their
 * own: hanging arms swing, fists pump, raised hands wave. The lantern keeps the drawing's own halo.
 * Everything is transforms on Views, run natively on the phone; under reduced motion it stands still.
 * `eyesShut` keeps its eyes closed (it is not looking while a password is typed), each change of
 * `cheer` makes it hop once (a step is done) and each change of `wince` shakes its head (that did
 * not work). `onPoke` hears every tap of a pokeable mascot.
 */
export function LivingMascot({
  pose,
  height,
  pokeable = false,
  excited = false,
  eyesShut = false,
  cheer = 0,
  wince = 0,
  onPoke,
}: {
  pose: MascotPose;
  height: number;
  pokeable?: boolean;
  excited?: boolean;
  eyesShut?: boolean;
  cheer?: number;
  wince?: number;
  onPoke?: () => void;
}) {
  const reduced = useReducedMotion();
  const p = PERSONALITY[pose];
  const k = height / BOX.height;
  const width = BOX.width * k;
  const layers = mascotLayers(pose);

  const v = useRef({
    bob: new Animated.Value(0),
    breathe: new Animated.Value(0),
    // 0.5 is upright: the sway runs either side of it.
    sway: new Animated.Value(0.5),
    flap: new Animated.Value(0),
    hands: new Animated.Value(0),
    burst: new Animated.Value(0),
    blink: new Animated.Value(0),
    hop: new Animated.Value(0),
    squash: new Animated.Value(0),
    shake: new Animated.Value(0),
  }).current;

  const shut = useRef(eyesShut);
  shut.current = eyesShut;

  // One value per sparkle, so each twinkles in its own time.
  const twinkles = useMemo(() => layers.sparks.map(() => new Animated.Value(0)), [layers]);

  /** Crouch, spring up, fall, land with a squash. */
  const hopOnce = (done?: () => void) =>
    Animated.sequence([
      go(v.squash, 1, 110, Easing.out(Easing.quad)),
      Animated.parallel([
        go(v.squash, -1, 180, Easing.out(Easing.quad)),
        go(v.hop, 1, 230, Easing.out(Easing.cubic)),
      ]),
      Animated.parallel([go(v.hop, 0, 250, Easing.in(Easing.quad)), go(v.squash, 0, 250)]),
      go(v.squash, 1, 80, Easing.out(Easing.quad)),
      go(v.squash, 0, 260, Easing.out(Easing.quad)),
    ]).start(() => done?.());

  // The loops for this pose (and for being held).
  useEffect(() => {
    if (reduced) return;
    let alive = true;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const later = (ms: number, fn: () => void) => {
      timers.push(setTimeout(() => alive && fn(), ms));
    };
    const loops = [wave(v.bob, p.bobMs), wave(v.breathe, p.breathMs), wave(v.sway, p.swayMs)];
    loops.push(wave(v.hands, p.handMs));
    if (excited) loops.push(wave(v.flap, 45), wave(v.shake, 50));
    else if (p.wings === 'buzz') loops.push(wave(v.flap, p.flapMs));
    loops.forEach((loop) => loop.start());

    // Burst marks: a quick pulse out, a slower return.
    if (p.sparks === 'radiate') {
      const pulse = Animated.loop(
        Animated.sequence([
          go(v.burst, 1, p.sparkMs * 0.4, Easing.out(Easing.quad)),
          go(v.burst, 0, p.sparkMs * 0.6, Easing.in(Easing.quad)),
        ]),
      );
      pulse.start();
      loops.push(pulse);
    }
    // Sparkles: each shrinks, flares and settles, then rests a moment; staggered.
    if (p.sparks === 'twinkle') {
      twinkles.forEach((value, i) => {
        const twinkle = () =>
          Animated.sequence([go(value, 1, p.sparkMs * 0.55), go(value, 0, p.sparkMs * 0.45)]).start(
            () => later(between([300, 1100]), twinkle),
          );
        later(i * 380, twinkle);
      });
    }
    // Now and then, a burst of wing beats.
    if (p.wings === 'flutter' && !excited) {
      const burst = () =>
        Animated.sequence(
          Array.from({ length: 4 }, () => [
            go(v.flap, 1, p.flapMs),
            go(v.flap, 0, p.flapMs),
          ]).flat(),
        ).start(() => later(between([1800, 4200]), burst));
      later(between([700, 1800]), burst);
    }
    // Blinks, sometimes two in a row.
    if (p.eyes) {
      const blink = () => {
        if (shut.current) return later(between(p.blink), blink);
        const once = [go(v.blink, 1, 70, Easing.linear), go(v.blink, 0, 120)];
        const twice = Math.random() < 0.25;
        Animated.sequence(twice ? [...once, Animated.delay(90), ...once] : once).start(() =>
          later(between(p.blink), blink),
        );
      };
      later(between(p.blink), blink);
    }
    // Little hops (a happy bounce in the reward pose).
    if (p.hopEvery && !excited) {
      const every = p.hopEvery;
      const hop = () => hopOnce(() => later(between(every), hop));
      later(between(every), hop);
    }

    return () => {
      alive = false;
      timers.forEach(clearTimeout);
      loops.forEach((loop) => loop.stop());
      [v.flap, v.shake, v.burst, ...twinkles].forEach((value) => value.setValue(0));
    };
    // hopOnce and the values are stable; the loops follow the pose and being held.
  }, [pose, reduced, excited]);

  // Eyes shut and open again (no blinking meanwhile).
  useEffect(() => {
    if (reduced) return v.blink.setValue(eyesShut ? 1 : 0);
    go(v.blink, eyesShut ? 1 : 0, eyesShut ? 140 : 180).start();
  }, [eyesShut, reduced]);

  // A happy hop for each cheer (not on first show).
  const cheered = useRef(cheer);
  useEffect(() => {
    if (cheer === cheered.current) return;
    cheered.current = cheer;
    if (!reduced) hopOnce();
  }, [cheer]);

  // A quick shake of the head for each wince (not on first show).
  const winced = useRef(wince);
  useEffect(() => {
    if (wince === winced.current) return;
    winced.current = wince;
    if (reduced) return;
    Animated.sequence([
      ...Array.from({ length: 3 }, () => go(v.shake, 1, 90, Easing.linear)),
      go(v.shake, 0, 140),
    ]).start();
  }, [wince]);

  // Squash into every new pose (not on first show).
  const shown = useRef(false);
  useEffect(() => {
    if (!shown.current) {
      shown.current = true;
      return;
    }
    if (reduced) return;
    Animated.sequence([
      go(v.squash, 1, 90, Easing.out(Easing.quad)),
      go(v.squash, 0, 320, Easing.out(Easing.back(1.4))),
    ]).start();
  }, [pose]);

  const flap = excited ? 20 : p.flap;
  const scaleY = Animated.multiply(
    v.squash.interpolate({ inputRange: [-1, 0, 1], outputRange: [1.05, 1, 0.92] }),
    v.breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1 + p.breath] }),
  );
  const scaleX = v.squash.interpolate({ inputRange: [-1, 0, 1], outputRange: [0.97, 1, 1.06] });

  const arms = ARMS[pose];
  /** The hands' movement for this pose; `side` is 1 for the left hand, -1 for the right. */
  const handMotion = (side: 1 | -1) => {
    const a = p.hand;
    if (p.hands === 'pump') {
      // Fists up and down in turn.
      const up = -a * k;
      return [
        {
          translateY: v.hands.interpolate({
            inputRange: [0, 1],
            outputRange: side === 1 ? [0, up] : [up, 0],
          }),
        },
      ];
    }
    if (p.hands === 'wave') {
      // Raised hands out from the head in turn (a raised left hand turns out anticlockwise).
      return [
        {
          rotate: v.hands.interpolate({
            inputRange: [0, 1],
            outputRange: side === 1 ? ['0deg', `${-a}deg`] : [`${a}deg`, '0deg'],
          }),
        },
      ];
    }
    // Hanging arms: both swing out a little and back together.
    return [
      {
        rotate: v.hands.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${a * side}deg`],
        }),
      },
    ];
  };

  const figure = (
    <Animated.View
      style={{
        width,
        height,
        transformOrigin: 'center bottom',
        transform: [
          { translateY: v.hop.interpolate({ inputRange: [0, 1], outputRange: [0, -p.hop * k] }) },
          { translateY: v.bob.interpolate({ inputRange: [0, 1], outputRange: [0, -p.bob * k] }) },
          {
            rotate: v.sway.interpolate({
              inputRange: [0, 1],
              outputRange: [`-${p.sway}deg`, `${p.sway}deg`],
            }),
          },
          {
            rotate: v.shake.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: ['0deg', '2deg', '-2deg'],
            }),
          },
          { scaleX },
          { scaleY },
        ],
      }}
    >
      <MovingLayer
        xml={layers.leftWing}
        origin={WING_ROOT.left}
        k={k}
        transform={[
          {
            rotate: v.flap.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', `${-flap}deg`],
            }),
          },
        ]}
      />
      <MovingLayer
        xml={layers.rightWing}
        origin={WING_ROOT.right}
        k={k}
        transform={[
          {
            rotate: v.flap.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${flap}deg`] }),
          },
        ]}
      />
      <SvgXml
        xml={layers.body}
        width={width}
        height={height}
        style={StyleSheet.absoluteFill}
        {...svgHidden}
      />
      {layers.sparks.map((spark, i) => {
        if (p.sparks === 'radiate') {
          // Out from the head (marks above it) or the lantern (marks below), fading as they go.
          const from = spark.y < 300 ? BURST_FROM.head : BURST_FROM.lantern;
          return (
            <MovingLayer
              key={i}
              xml={spark.xml}
              origin={from}
              k={k}
              opacity={v.burst.interpolate({ inputRange: [0, 1], outputRange: [1, 0.55] })}
              transform={[
                { scale: v.burst.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }) },
              ]}
            />
          );
        }
        const t = twinkles[i];
        return (
          <MovingLayer
            key={i}
            xml={spark.xml}
            origin={spark}
            k={k}
            opacity={t?.interpolate({ inputRange: [0, 0.4, 1], outputRange: [1, 0.7, 1] })}
            transform={
              t && p.sparks === 'twinkle'
                ? [
                    {
                      scale: t.interpolate({
                        inputRange: [0, 0.4, 1],
                        outputRange: [1, 0.72, 1.15],
                      }),
                    },
                    {
                      rotate: t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '20deg'] }),
                    },
                  ]
                : []
            }
          />
        );
      })}
      {arms ? (
        <>
          <MovingLayer
            xml={layers.leftHand}
            origin={arms.left.pivot}
            k={k}
            transform={handMotion(1)}
          />
          <MovingLayer
            xml={layers.rightHand}
            origin={{ x: BOX.width - arms.left.pivot.x, y: arms.left.pivot.y }}
            k={k}
            transform={handMotion(-1)}
          />
        </>
      ) : null}
      {p.eyes?.map((eye, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: eye.x * k,
            top: eye.y * k,
            width: eye.width * k,
            height: eye.height * k,
            borderRadius: (eye.width * k) / 2,
            backgroundColor: c.brand,
            // The lower lash: a closed eye reads as a thin white curve, not a blank face.
            borderBottomWidth: Math.max(1, 7 * k),
            borderBottomColor: c.onBrand,
            transformOrigin: 'center top',
            transform: [
              { scaleY: v.blink.interpolate({ inputRange: [0, 1], outputRange: [0.001, 1] }) },
            ],
          }}
        />
      ))}
    </Animated.View>
  );

  return (
    <View style={{ width, height }} aria-hidden>
      {pokeable ? (
        <Pressable
          accessible={false}
          onPress={() => {
            if (!reduced) hopOnce();
            onPoke?.();
          }}
        >
          {figure}
        </Pressable>
      ) : (
        figure
      )}
    </View>
  );
}

/**
 * One layer of the pose (a wing, a hand, a burst mark, a sparkle), drawn at the full pose size and
 * moved about its own origin (a wing's root, a shoulder, the head) with the given transforms.
 */
function MovingLayer(props: {
  xml: string;
  origin: { x: number; y: number };
  k: number;
  transform: Animated.WithAnimatedValue<ViewStyle['transform']>;
  opacity?: Animated.AnimatedInterpolation<number>;
}) {
  const { k } = props;
  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        {
          transformOrigin: `${props.origin.x * k}px ${props.origin.y * k}px`,
          transform: props.transform,
          opacity: props.opacity ?? 1,
        },
      ]}
    >
      <SvgXml xml={props.xml} width={BOX.width * k} height={BOX.height * k} {...svgHidden} />
    </Animated.View>
  );
}
