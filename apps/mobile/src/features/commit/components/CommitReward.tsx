import { TRUST } from '@kapitwatt/shared';
import { themes } from '@kapitwatt/styles';
import { radius, space } from '@kapitwatt/tokens';
import { Text } from '@kapitwatt/ui';
import { StyleSheet, View } from 'react-native';

const c = themes.light.color;
const ink = c.onTertiaryContainer;

/** What a verified cut adds (Kuryente Orange: rewards). */
export function CommitReward() {
  return (
    <View style={styles.card}>
      <Text variant="titleMedium" style={{ color: ink }}>
        {`+${TRUST.cleanEvent} Contribution Score`}
      </Text>
      <Text variant="bodyMedium" style={{ color: ink }}>
        if your cut is verified
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    backgroundColor: c.tertiaryContainer,
    padding: space[4],
    gap: 2,
  },
});
