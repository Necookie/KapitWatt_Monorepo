import { contributionStanding } from '@kapitwatt/shared';
import { themes } from '@kapitwatt/styles';
import { StyleSheet, View } from 'react-native';
import { radius, space } from '@kapitwatt/tokens';
import { formatKwh } from '@/utils/format';
import { Stat } from './Stat';

const c = themes.light.color;

/** The household's figures on top of the sheet: Contribution Score, its level, energy saved. */
export function ProfileStats(props: { score: number; savedKwh: number }) {
  return (
    <View style={styles.stats}>
      <Stat label="Score" value={String(Math.round(props.score))} />
      <View style={styles.divider} />
      <Stat label="Level" value={contributionStanding(props.score).band.name} />
      <View style={styles.divider} />
      <Stat label="Saved" value={formatKwh(props.savedKwh)} />
    </View>
  );
}

const styles = StyleSheet.create({
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    backgroundColor: c.surfaceContainerLow,
    paddingVertical: space[3],
  },
  divider: { width: 1, alignSelf: 'stretch', backgroundColor: c.outlineVariant },
});
