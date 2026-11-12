import { themes } from '@kapitwatt/styles';
import { radius, space } from '@kapitwatt/tokens';
import { Text } from '@kapitwatt/ui';
import { StyleSheet, View } from 'react-native';

const c = themes.light.color;

/** The household's barangay against the one around it: "leads by ..." or "... to pass ...". */
export function ChaseCard(props: { headline: string; line: string }) {
  return (
    <View style={styles.card}>
      <Text variant="titleMedium" style={{ color: c.onPrimaryContainer }}>
        {props.headline}
      </Text>
      <Text variant="bodyMedium" style={{ color: c.onPrimaryContainer }}>
        {props.line}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    backgroundColor: c.primaryContainer,
    padding: space[4],
    gap: 2,
  },
});
