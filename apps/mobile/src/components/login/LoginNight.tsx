import { Icon } from '@kapitwatt/icons';
import { themes } from '@kapitwatt/styles';
import { Text, type MascotPose } from '@kapitwatt/ui';
import { useEffect, useMemo } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, View } from 'react-native';
import { MOON_OUTER, MoonMascot } from '@/components/welcome/Moon';
import { useReducedMotion } from '@/lib/useReducedMotion';

const c = themes.light.color;
const NATIVE = Platform.OS !== 'web';

const TOP_ROW = 48;
const GAP = 16;
/** Where login's white sheet starts on screen: welcome's sheet rises to exactly there. */
export const loginSheetTop = (insetTop: number) => insetTop + TOP_ROW + MOON_OUTER + GAP;

/** The z's of a sleeping Alitaptap: each drifts up and away in turn. */
const SNOOZE_MS = 2700;
const ZS = [
  { size: 16, delay: 0 },
  { size: 21, delay: SNOOZE_MS / 3 },
  { size: 26, delay: (SNOOZE_MS * 2) / 3 },
] as const;

/**
 * The top of login: welcome's night carries on, with Alitaptap on the moon. Asleep (the dimmed
 * pose) until the household starts typing, with z's drifting off it; then awake, eyes shut for the
 * password, wincing at a wrong one, and lit up in the reward pose once logged in.
 */
export function LoginNight(props: {
  insetTop: number;
  pose: MascotPose;
  eyesShut: boolean;
  cheer: number;
  wince: number;
  onPoke: () => void;
  onBack: () => void;
}) {
  return (
    <View style={{ paddingTop: props.insetTop }}>
      <View style={styles.topRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={props.onBack}
          style={styles.back}
        >
          <Icon name="back" color="onBrand" />
        </Pressable>
      </View>
      <View style={styles.moon}>
        <MoonMascot
          pose={props.pose}
          eyesShut={props.eyesShut}
          cheer={props.cheer}
          wince={props.wince}
          onPoke={props.onPoke}
        />
        {props.pose === 'dimmed' ? <Snooze /> : null}
      </View>
    </View>
  );
}

function Snooze() {
  const reduced = useReducedMotion();
  const drift = useMemo(() => ZS.map(() => new Animated.Value(reduced ? 0.5 : 0)), [reduced]);
  useEffect(() => {
    if (reduced) return;
    const loops = drift.map((v, i) =>
      Animated.sequence([
        Animated.delay(ZS[i]!.delay),
        Animated.loop(
          Animated.timing(v, {
            toValue: 1,
            duration: SNOOZE_MS,
            easing: Easing.out(Easing.quad),
            useNativeDriver: NATIVE,
          }),
        ),
      ]),
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [drift, reduced]);

  return (
    <View pointerEvents="none" style={styles.snooze} aria-hidden>
      {ZS.map((z, i) => {
        const v = drift[i]!;
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              bottom: 0,
              opacity: v.interpolate({ inputRange: [0, 0.2, 0.75, 1], outputRange: [0, 1, 1, 0] }),
              transform: [
                { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, 22] }) },
                { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -46] }) },
                { rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['-8deg', '10deg'] }) },
              ],
            }}
          >
            <Text style={{ fontSize: z.size, lineHeight: z.size + 4, color: c.primaryContainer }}>
              z
            </Text>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: { height: TOP_ROW, flexDirection: 'row', alignItems: 'center', paddingLeft: 4 },
  back: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  moon: { alignItems: 'center', marginBottom: GAP },
  // Off the moon's upper right, by Alitaptap's head.
  snooze: {
    position: 'absolute',
    top: MOON_OUTER * 0.2,
    left: '50%',
    marginLeft: MOON_OUTER * 0.42,
    width: 1,
    height: 1,
  },
});
