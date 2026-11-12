import { Icon } from '@kapitwatt/icons';
import type { MascotPose } from '@kapitwatt/ui';
import { Pressable, StyleSheet, View } from 'react-native';
import { LOGIN_MOON_GAP, LOGIN_TOP_ROW } from '@/components/night/geometry';
import { MoonMascot } from '@/components/night/Moon';
import { Snooze } from './Snooze';

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

const styles = StyleSheet.create({
  topRow: { height: LOGIN_TOP_ROW, flexDirection: 'row', alignItems: 'center', paddingLeft: 4 },
  back: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  moon: { alignItems: 'center', marginBottom: LOGIN_MOON_GAP },
});
