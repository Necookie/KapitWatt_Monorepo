import { StyleSheet, View } from 'react-native';
import { fontFamily } from '@kapitwatt/tokens';
import { themes } from '@kapitwatt/styles';
import { Text } from '@kapitwatt/ui';

const c = themes.light.color;

/** Stand-in for a screen that is routed but not built yet. Delete once nothing uses it. */
export function Placeholder(props: { title: string; priority: 'P0' | 'P1' | 'P2'; todo: string }) {
  return (
    <View style={styles.root}>
      <Text variant="labelLarge" style={styles.priority}>
        {props.priority}
      </Text>
      <Text variant="headlineSmall" style={styles.title}>
        {props.title}
      </Text>
      <Text variant="bodyLarge" style={styles.todo}>
        {props.todo}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 24,
    gap: 8,
    justifyContent: 'center',
    backgroundColor: c.surface,
  },
  priority: { color: c.simulated, fontFamily: fontFamily.semibold },
  title: { color: c.onSurface },
  todo: { color: c.onSurfaceVariant },
});
