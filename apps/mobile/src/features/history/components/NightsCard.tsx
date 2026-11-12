import { themes } from '@kapitwatt/styles';
import { radius, space, withAlpha } from '@kapitwatt/tokens';
import { Text } from '@kapitwatt/ui';
import { StyleSheet, View } from 'react-native';
import { formatKwh } from '@/utils/format';
import { formatScoreChange } from '@/utils/perks';
import type { NightState } from '../utils/night-state';
import { NightLantern } from './NightLantern';

const c = themes.light.color;
const ink = c.onTertiaryContainer;
const LANTERN = 30;
const DROP = 8;

/**
 * The top of the lantern log (Kuryente Orange: rewards): the nights the household helped, its
 * newest nights as lanterns on a string (oldest left), the kWh it saved and the score they added.
 */
export function NightsCard(props: {
  helped: number;
  kwh: number;
  score: number;
  string: NightState[];
}) {
  return (
    <View style={styles.card}>
      <Text variant="labelMedium" style={[styles.overline, { color: ink }]}>
        {`${props.helped} ${props.helped === 1 ? 'NIGHT' : 'NIGHTS'} YOU HELPED`}
      </Text>
      <View
        style={styles.string}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <View style={styles.wire} />
        {props.string.map((state, i) => (
          <View key={i} style={styles.hang}>
            <View style={styles.cord} />
            <NightLantern state={state} size={LANTERN} ink={ink} />
          </View>
        ))}
      </View>
      <View style={styles.figures}>
        <Text variant="titleLarge" style={[styles.tabular, { color: ink }]}>
          {`${formatKwh(props.kwh)} saved`}
        </Text>
        <Text variant="titleSmall" style={[styles.tabular, { color: ink }]}>
          {`${formatScoreChange(props.score)} score`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabular: { fontVariant: ['tabular-nums'] },
  card: {
    borderRadius: radius.lg,
    backgroundColor: c.tertiaryContainer,
    padding: space[4],
    gap: space[3],
  },
  overline: { letterSpacing: 0.5 },
  string: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 2 },
  wire: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 2,
    height: 1.5,
    backgroundColor: withAlpha(ink, 0.3),
  },
  hang: { alignItems: 'center' },
  cord: { width: 1, height: DROP, backgroundColor: withAlpha(ink, 0.3) },
  figures: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
});
