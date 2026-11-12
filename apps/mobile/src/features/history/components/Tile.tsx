import { themes } from '@kapitwatt/styles';
import { Text } from '@kapitwatt/ui';
import { StyleSheet, View } from 'react-native';
import { radius, space } from '@/styles/theme';

const c = themes.light.color;

export function Tile(props: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={[styles.tile, props.accent && { backgroundColor: c.brandAccent }]}>
      <Text
        variant="bodySmall"
        style={{ color: props.accent ? c.onBrandAccent : c.onSurfaceVariant }}
      >
        {props.label}
      </Text>
      <Text
        variant="titleLarge"
        style={[styles.tabular, { color: props.accent ? c.onBrandAccent : c.onSurface }]}
      >
        {props.value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tabular: { fontVariant: ['tabular-nums'] },
  tile: {
    flex: 1,
    gap: 2,
    padding: space.md,
    borderRadius: radius.lg,
    backgroundColor: c.surfaceContainerLow,
  },
});
