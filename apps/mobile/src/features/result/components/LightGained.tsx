import { contributionStanding } from '@kapitwatt/shared';
import { themes } from '@kapitwatt/styles';
import { radius, space } from '@kapitwatt/tokens';
import { Text } from '@kapitwatt/ui';
import { StyleSheet, View } from 'react-native';
import { formatScoreChange } from '@/utils/perks';

const c = themes.light.color;
const ink = c.onTertiaryContainer;

/** What the night did to the household's light (Kuryente Orange: rewards), and its level now. */
export function LightGained(props: { change: number; score: number }) {
  const { band } = contributionStanding(props.score);
  return (
    <View style={styles.card}>
      <View style={styles.words}>
        <Text variant="labelMedium" style={[styles.overline, { color: ink }]}>
          YOUR LIGHT
        </Text>
        <Text variant="headlineSmall" style={[styles.tabular, { color: ink }]}>
          {formatScoreChange(props.change)}
        </Text>
        <Text variant="bodyMedium" style={{ color: ink }}>
          Contribution Score
        </Text>
      </View>
      <View style={styles.level}>
        <Text variant="titleSmall" style={{ color: c.onBrandAccent }}>
          {band.name}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabular: { fontVariant: ['tabular-nums'] },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    borderRadius: radius.lg,
    backgroundColor: c.tertiaryContainer,
    padding: space[4],
  },
  words: { flex: 1, gap: 2 },
  overline: { letterSpacing: 0.5 },
  level: {
    height: 28,
    paddingHorizontal: space[3],
    borderRadius: radius.full,
    backgroundColor: c.brandAccent,
    justifyContent: 'center',
  },
});
