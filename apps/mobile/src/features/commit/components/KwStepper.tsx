import { themes } from '@kapitwatt/styles';
import { Text } from '@kapitwatt/ui';
import { StyleSheet, View } from 'react-native';
import { formatKw } from '@/utils/format';
import { fonts, space } from '@/styles/theme';
import { STEP_KW } from '../utils/commit-step';
import { RoundButton } from './RoundButton';

const c = themes.light.color;

/** The chosen kW between − and + buttons that step it by STEP_KW, up to the cap. */
export function KwStepper(props: { selected: number; cap: number; onSet: (kw: number) => void }) {
  const { selected, cap } = props;
  return (
    <View style={styles.stepper}>
      <RoundButton
        icon="remove"
        label={`Less, by ${formatKw(STEP_KW)}`}
        disabled={selected <= STEP_KW}
        onPress={() => props.onSet(selected - STEP_KW)}
      />
      <View style={styles.figure} accessibilityLiveRegion="polite">
        <Text style={styles.figureNumber}>{selected.toFixed(1)}</Text>
        <Text variant="headlineSmall" color="onSurfaceVariant">
          kW
        </Text>
      </View>
      <RoundButton
        icon="add"
        label={`More, by ${formatKw(STEP_KW)}`}
        disabled={selected >= cap}
        onPress={() => props.onSet(selected + STEP_KW)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space.sm,
  },
  figure: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  figureNumber: {
    fontFamily: fonts.semibold,
    fontSize: 64,
    lineHeight: 72,
    color: c.onSurface,
    fontVariant: ['tabular-nums'],
  },
});
