import { themes } from '@kapitwatt/styles';
import { Text } from '@kapitwatt/ui';
import { StyleSheet, View } from 'react-native';

const c = themes.light.color;

export function Stat(props: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text variant="titleMedium" style={[styles.tabular, { color: c.onSurface }]}>
        {props.value}
      </Text>
      <Text variant="bodySmall" color="onSurfaceVariant">
        {props.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tabular: { fontVariant: ['tabular-nums'] },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
});
