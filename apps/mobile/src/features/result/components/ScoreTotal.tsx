import { themes } from '@kapitwatt/styles';
import { Text } from '@kapitwatt/ui';
import { StyleSheet, View } from 'react-native';
import { formatScoreChange } from '@/utils/perks';
import { fonts, radius, space } from '@/styles/theme';

const c = themes.light.color;

/** The Contribution Score change, with a chip when the barangay reached its target. */
export function ScoreTotal(props: { change: number; barangayTargetHit: boolean }) {
  return (
    <View style={styles.total}>
      <Text variant="bodyMedium" color="onSurfaceVariant">
        Your Contribution Score
      </Text>
      <Text style={styles.figure}>{formatScoreChange(props.change)}</Text>
      {props.barangayTargetHit ? (
        <View style={styles.chip}>
          <Text variant="titleSmall" style={{ color: c.onBrandAccent }}>
            Your barangay reached its target
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  total: { alignItems: 'center', gap: space.sm, paddingVertical: space.sm },
  figure: {
    fontFamily: fonts.semibold,
    fontSize: 56,
    lineHeight: 64,
    color: c.onSurface,
    fontVariant: ['tabular-nums'],
  },
  chip: {
    height: 32,
    paddingHorizontal: space.md,
    borderRadius: radius.sm,
    backgroundColor: c.brandAccent,
    justifyContent: 'center',
  },
});
