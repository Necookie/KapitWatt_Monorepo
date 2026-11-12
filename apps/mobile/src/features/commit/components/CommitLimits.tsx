import { TRUST } from '@kapitwatt/shared';
import { themes } from '@kapitwatt/styles';
import { Text } from '@kapitwatt/ui';
import { StyleSheet, View } from 'react-native';
import { formatKw } from '@/utils/format';
import { radius, space } from '@/styles/theme';

const c = themes.light.color;

/** The household's cap and what a verified cut adds to its score. */
export function CommitLimits(props: { cap: number }) {
  return (
    <View style={styles.panel}>
      <View style={styles.panelRow}>
        <Text variant="bodyMedium" color="onSurfaceVariant">
          Most you can commit
        </Text>
        <Text variant="titleSmall">{formatKw(props.cap)}</Text>
      </View>
      <View style={styles.panelRow}>
        <Text variant="bodyMedium" color="onSurfaceVariant">
          If your cut is verified
        </Text>
        <Text variant="titleSmall" color="tertiary">
          {`+${TRUST.cleanEvent} Contribution Score`}
        </Text>
      </View>
      <Text variant="bodySmall" color="onSurfaceVariant">
        Switch off whatever you like. Nobody checks which appliance.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: radius.lg,
    backgroundColor: c.surfaceContainerLow,
    padding: space.lg,
    gap: space.sm,
  },
  panelRow: { flexDirection: 'row', justifyContent: 'space-between' },
});
