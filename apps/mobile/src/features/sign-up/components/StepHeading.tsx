import { themes } from '@kapitwatt/styles';
import { Text, type MascotPose } from '@kapitwatt/ui';
import { forwardRef, type ComponentRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { fontFamily } from '@kapitwatt/tokens';
import { LivingMascot } from '@/components/mascot/LivingMascot';
import { HEADING_MASCOT } from '../utils/heading-mascot';

const c = themes.light.color;

/**
 * The top of each sign-up step on the white sheet: Alitaptap, alive, beside the step's name and its
 * one line. The ref is the mascot's box (the spark leaves from its lantern).
 */
export const StepHeading = forwardRef<
  ComponentRef<typeof View>,
  {
    label: string;
    line: string;
    pose: MascotPose;
    reward?: boolean;
    eyesShut?: boolean;
    cheer?: number;
  }
>(function StepHeading(props, mascotRef) {
  return (
    <View style={styles.row}>
      <View ref={mascotRef} collapsable={false}>
        <LivingMascot
          pose={props.pose}
          height={HEADING_MASCOT}
          pokeable
          eyesShut={props.eyesShut}
          cheer={props.cheer}
        />
      </View>
      <View style={styles.words}>
        <Text
          variant="labelMedium"
          style={[styles.label, { color: props.reward ? c.tertiary : c.primary }]}
        >
          {props.label.toUpperCase()}
        </Text>
        <Text variant="titleLarge" accessibilityRole="header" style={styles.line}>
          {props.line}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  words: { flex: 1, gap: 2 },
  label: { fontFamily: fontFamily.semibold, letterSpacing: 0.5 },
  line: { fontSize: 22, lineHeight: 28, color: c.onSurface },
});
