import { themes } from '@kapitwatt/styles';
import { Text } from '@kapitwatt/ui';
import { StyleSheet, View } from 'react-native';
import { initials } from '../utils/initials';

const c = themes.light.color;

/** The household's initials in a light disc, beside its name in the night band. */
export function Avatar({ name }: { name: string | null }) {
  return (
    <View style={styles.avatar} accessibilityElementsHidden importantForAccessibility="no">
      <Text variant="titleLarge" style={{ color: c.brand }}>
        {initials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: c.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
