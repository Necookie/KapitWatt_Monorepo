import { Text } from '@kapitwatt/ui';
import { StyleSheet, View } from 'react-native';
import { space } from '@kapitwatt/tokens';
import { TextField } from '@/components/ui';
import type { StepProps } from '../utils/draft';
import { MeterCard } from './MeterCard';
import { SerialPlate } from './SerialPlate';

export function MeterStep({ draft, set }: StepProps) {
  return (
    <View style={styles.fields}>
      <View style={styles.fieldWithCheck}>
        <Text variant="labelLarge" color="onSurfaceVariant">
          Meter type
        </Text>
        <View style={styles.meterRow} accessibilityRole="radiogroup">
          <MeterCard
            icon="meterPhoto"
            title="Regular"
            detail="2 photos per event"
            selected={draft.meterType === 'standard'}
            onPress={() => set({ meterType: 'standard' })}
          />
          <MeterCard
            icon="smartMeter"
            title="Smart"
            detail="No photos"
            selected={draft.meterType === 'ami'}
            onPress={() => set({ meterType: 'ami' })}
          />
        </View>
      </View>
      <SerialPlate
        label="Serial number"
        hint="Printed on the meter, under the dials"
        value={draft.meterSerial}
        onChange={(meterSerial) => set({ meterSerial })}
      />
      <TextField
        label="Monthly use"
        supportingText="On your bill"
        keyboardType="number-pad"
        placeholder="250"
        suffix="kWh"
        value={draft.billText}
        onChangeText={(billText) => set({ billText })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fields: { gap: 20 },
  fieldWithCheck: { gap: 6 },
  meterRow: { flexDirection: 'row', gap: space[3] },
});
