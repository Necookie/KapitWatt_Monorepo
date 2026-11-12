import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme';

/** Stand-in for a screen that is routed but not built yet. Delete once nothing uses it. */
export function Placeholder(props: { title: string; priority: 'P0' | 'P1' | 'P2'; todo: string }) {
  return (
    <View style={styles.root}>
      <Text style={styles.priority}>{props.priority}</Text>
      <Text style={styles.title}>{props.title}</Text>
      <Text style={styles.todo}>{props.todo}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 24,
    gap: 8,
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  priority: { color: colors.amber, fontWeight: '700' },
  title: { color: colors.ink, fontSize: 24, fontWeight: '700' },
  todo: { color: colors.muted, fontSize: 16, lineHeight: 22 },
});
