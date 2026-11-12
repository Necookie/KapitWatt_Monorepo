import { themes } from '@kapitwatt/styles';
import { radius, space } from '@kapitwatt/tokens';
import { Text } from '@kapitwatt/ui';
import { StyleSheet, View } from 'react-native';
import { formatKw } from '@/utils/format';

const c = themes.light.color;

/** What the chosen cut means for the window, the household's limit, and that any appliance will do. */
export function CommitLimits(props: { selected: number; cap: number; hours: number }) {
  const hours = Number.isInteger(props.hours) ? String(props.hours) : props.hours.toFixed(1);
  return (
    <View style={styles.panel}>
      <Text variant="titleSmall">
        {`Keep your use ${formatKw(props.selected)} lower for ${hours} hours.`}
      </Text>
      <Text variant="bodyMedium" color="onSurfaceVariant">
        {`The most you can commit is ${formatKw(props.cap)}. Switch off whatever you like; nobody checks which appliance.`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: radius.lg,
    backgroundColor: c.surfaceContainerLow,
    padding: space[4],
    gap: space[1],
  },
});
