import type { MeterType } from '@kapitwatt/shared';
import { themes } from '@kapitwatt/styles';
import { fontFamily, radius, space, withAlpha } from '@kapitwatt/tokens';
import { Text } from '@kapitwatt/ui';
import { StyleSheet, View } from 'react-native';

const c = themes.light.color;
const MARK = withAlpha(c.onBrand, 0.65);

/**
 * The household's meter on the faceplate the serial was typed onto at sign-up: Grid Indigo, the
 * serial large, the meter type and monthly use, and what that meter means at each event.
 */
export function MeterPlate(props: { type: MeterType; serial: string; billKwhMonth: number }) {
  const smart = props.type === 'ami';
  return (
    <View style={styles.plate}>
      <View style={styles.marks}>
        <Text variant="labelSmall" style={[styles.mark, { color: MARK }]}>
          SERIAL NO.
        </Text>
        <Text variant="labelSmall" style={[styles.mark, { color: MARK }]}>
          {smart ? 'SMART METER · kWh' : 'REGULAR METER · kWh'}
        </Text>
      </View>
      <Text style={styles.serial}>{props.serial}</Text>
      <Text variant="bodySmall" style={{ color: MARK }}>
        {`About ${props.billKwhMonth} kWh a month · ${smart ? 'no photos needed' : '2 photos per event'}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  plate: {
    borderRadius: radius.lg,
    backgroundColor: c.brand,
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    gap: space[1],
  },
  marks: { flexDirection: 'row', justifyContent: 'space-between' },
  mark: { letterSpacing: 1 },
  serial: {
    fontFamily: fontFamily.semibold,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: 4,
    color: c.onBrand,
  },
});
