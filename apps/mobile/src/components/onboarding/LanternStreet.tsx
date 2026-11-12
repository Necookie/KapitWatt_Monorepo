import { Icon } from '@kapitwatt/icons';
import { themes } from '@kapitwatt/styles';
import { withAlpha } from '@kapitwatt/tokens';
import { Text } from '@kapitwatt/ui';
import { forwardRef, useEffect, useRef, type ComponentRef } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SCENE, Skyline, STREET_TOP, WINDOW, WINDOWS, wireY } from '@/components/welcome/Skyline';
import { useReducedMotion } from '@/lib/useReducedMotion';

const c = themes.light.color;
const NATIVE = Platform.OS !== 'web';
const ON_SOFT = withAlpha(c.onBrand, 0.78);

/** How far the white sheet below covers the foot of the street (px). */
export const SHEET_OVERLAP = 12;
/** One lantern per sign-up step. */
const LANTERNS = 6;
/** Lantern size on the scene's grid, and the string it hangs from. */
const LANTERN = 22;
const STRING = 5;
/** The household's own window (one of the street's), marked with a pin once a barangay is picked. */
const HOME = WINDOWS[2];
/** The street sign hangs off the right-hand pole. */
const SIGN = { right: 331, top: 115 };
/** Windows light up one after another at review. */
const WINDOWS_MS = 1400;

/** The street's height for a screen width (it is drawn edge to edge). */
export const streetHeight = (width: number) => (SCENE.height * width) / SCENE.width;
/** Where sign-up's white sheet starts on screen: welcome's sheet rises to exactly there. */
export const sheetTop = (width: number, insetTop: number) =>
  insetTop + streetHeight(width) - SHEET_OVERLAP;

/** A lantern's centre on the scene's grid: spaced evenly along the upper wire between the poles. */
function lanternAt(i: number) {
  const x = 24 + (312 * (i + 1)) / (LANTERNS + 1);
  return { x, top: wireY(x), y: wireY(x) + STRING + 2 + LANTERN / 2 };
}

/** Lantern i's centre in px, from the street's top left corner (for the spark to fly to). */
export function lanternCentre(i: number, width: number) {
  const k = width / SCENE.width;
  const at = lanternAt(i);
  return { x: at.x * k, y: at.y * k };
}

/**
 * Sign-up's header: the welcome screen's night street, now with six lanterns on its power line,
 * one per step. The first `lit` are lit (sign-up raises it as Alitaptap's spark lands in each); the
 * step you are on waits with a ring. Picking a barangay hangs its name on the
 * street sign and marks your window with a pin; at review (`celebrate`) every window lights up.
 * Flat shapes only (DESIGN.md); under reduced motion everything simply appears.
 */
export const LanternStreet = forwardRef<
  ComponentRef<typeof View>,
  {
    step: number;
    lit: number;
    home: string | null;
    celebrate: boolean;
    onBack: () => void;
    backLabel: string;
    disabled?: boolean;
  }
>(function LanternStreet(props, streetRef) {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const { width } = useWindowDimensions();
  const k = width / SCENE.width;
  const windows = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!props.celebrate) return windows.setValue(1);
    if (reduced) return windows.setValue(0);
    Animated.timing(windows, {
      toValue: 0,
      duration: WINDOWS_MS,
      delay: 200,
      easing: Easing.linear,
      useNativeDriver: NATIVE,
    }).start();
  }, [props.celebrate]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.night} />
      <View ref={streetRef} style={{ width, height: streetHeight(width) }}>
        <Skyline cut={windows} width={width} />
        <Home on={props.home !== null} k={k} />
        {Array.from({ length: LANTERNS }, (_, i) => (
          <Lantern
            key={i}
            k={k}
            at={lanternAt(i)}
            lit={i < props.lit}
            waiting={i === props.step && i >= props.lit}
          />
        ))}
        {props.home ? <Sign name={props.home} k={k} /> : null}
        <View style={styles.topRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={props.backLabel}
            disabled={props.disabled}
            onPress={props.onBack}
            style={styles.back}
          >
            <Icon name="back" color="onBrand" />
          </Pressable>
          <Text
            variant="labelLarge"
            style={{ color: ON_SOFT }}
            accessibilityRole="progressbar"
            accessibilityLabel={`Step ${props.step + 1} of ${LANTERNS}`}
            accessibilityValue={{ min: 1, max: LANTERNS, now: props.step + 1 }}
          >
            {props.step + 1} of {LANTERNS}
          </Text>
        </View>
      </View>
    </View>
  );
});

/** A round lantern like Alitaptap's tail: Kuryente Orange with warm ribs when lit, dim when not. */
function Lantern(props: {
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

/** Your house: its window turns Kuryente Orange under a pin. */
function Home({ on, k }: { on: boolean; k: number }) {
  const reduced = useReducedMotion();
  const shown = useRef(new Animated.Value(on ? 1 : 0)).current;
  useEffect(() => {
    if (reduced) return shown.setValue(on ? 1 : 0);
    Animated.timing(shown, {
      toValue: on ? 1 : 0,
      duration: on ? 360 : 200,
      easing: Easing.out(Easing.back(2)),
      useNativeDriver: NATIVE,
    }).start();
  }, [on]);
  const [x, y] = HOME;
  const pin = 16 * k;
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: shown }]}>
      <View
        style={{
          position: 'absolute',
          left: x * k,
          top: (y + STREET_TOP) * k,
          width: WINDOW * k,
          height: WINDOW * k,
          borderRadius: 1.5 * k,
          backgroundColor: c.brandAccent,
        }}
      />
      <Animated.View
        style={{
          position: 'absolute',
          left: (x + WINDOW / 2) * k - pin / 2,
          top: (y + STREET_TOP) * k - pin - 1,
          transform: [
            { translateY: shown.interpolate({ inputRange: [0, 1], outputRange: [-8 * k, 0] }) },
          ],
        }}
      >
        <Icon name="location" size="sm" weight="fill" color="tertiaryContainer" />
      </Animated.View>
    </Animated.View>
  );
}

/** The barangay's name on a street sign hung off the pole. */
function Sign({ name, k }: { name: string; k: number }) {
  return (
    <View
      pointerEvents="none"
      style={[styles.sign, { right: (SCENE.width - SIGN.right) * k, top: SIGN.top * k }]}
    >
      <Text variant="labelSmall" numberOfLines={1} style={{ color: c.onPrimaryContainer }}>
        {name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: c.brand, overflow: 'hidden' },
  night: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: withAlpha(c.onPrimaryContainer, 0.5),
  },
  topRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 4,
    paddingRight: 20,
  },
  back: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  lantern: { position: 'absolute', overflow: 'hidden' },
  rib: {
    position: 'absolute',
    width: 1.2,
    borderRadius: 1,
    backgroundColor: c.tertiaryContainer,
  },
  ribDim: { backgroundColor: withAlpha(c.primaryContainer, 0.3) },
  sign: {
    position: 'absolute',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    backgroundColor: c.primaryContainer,
  },
});
