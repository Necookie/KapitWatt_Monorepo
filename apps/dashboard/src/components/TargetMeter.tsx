import { StyleSheet, View } from 'react-native';
import { barScale, motion } from '@/styles/motion';
import { colors } from '@/styles/theme';

/** Bars drawn with plain Views: no chart library needed for magnitudes on one axis. */

const END = 4;

/**
 * Progress against a target, as a share of it. The track runs to 125% so that a
 * barangay past its target visibly crosses the 100% tick instead of pinning at the end.
 */
export function TargetMeter({
  value,
  target,
  color = colors.series.deliveredPhoto,
}: {
  value: number;
  target: number;
  color?: string;
}) {
  const scale = 1.25;
  const share = target > 0 ? value / target : 0;
  const fill = Math.min(share, scale) / scale;
  return (
    <View
      style={styles.meter}
      accessibilityRole="progressbar"
      accessibilityLabel={`${Math.round(share * 100)}% of target`}
    >
      <View style={styles.meterTrack}>
        <View
          style={[
            motion.growX,
            barScale(fill),
            {
              height: 8,
              backgroundColor: color,
              borderTopRightRadius: END,
              borderBottomRightRadius: END,
            },
          ]}
        />
      </View>
      <View style={[styles.meterTick, { left: `${(1 / scale) * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  meter: { height: 14, justifyContent: 'center', minWidth: 80 },
  meterTrack: { height: 8, backgroundColor: colors.track, borderRadius: 2, overflow: 'hidden' },
  meterTick: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 0,
    borderLeftWidth: 1.5,
    borderLeftColor: colors.ink,
  },
});
