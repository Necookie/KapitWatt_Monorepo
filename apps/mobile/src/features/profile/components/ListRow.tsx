import { Icon, type IconName } from '@kapitwatt/icons';
import { themes } from '@kapitwatt/styles';
import { Text } from '@kapitwatt/ui';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { space, stateLayer, withAlpha } from '@kapitwatt/tokens';

const c = themes.light.color;

export function ListRow(props: {
  icon: IconName;
  label: string;
  detail?: string;
  onPress?: () => void;
  trailing?: ReactNode;
  tone?: 'primary' | 'error';
  last?: boolean;
}) {
  const color = props.tone ?? 'onSurface';
  const content = (
    <>
      <Icon name={props.icon} color={props.tone ?? 'onSurfaceVariant'} />
      <View style={styles.flex}>
        <Text variant="titleSmall" color={color}>
          {props.label}
        </Text>
        {props.detail ? (
          <Text variant="bodySmall" color="onSurfaceVariant">
            {props.detail}
          </Text>
        ) : null}
      </View>
      {props.trailing ??
        (props.onPress && !props.tone ? (
          <Icon name="chevronRight" size="sm" color="onSurfaceVariant" />
        ) : null)}
    </>
  );
  const style = [styles.row, !props.last && styles.divider];
  if (!props.onPress) return <View style={style}>{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={props.onPress}
      style={({ pressed }) => [...style, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    minHeight: 56,
    paddingHorizontal: space[4],
    paddingVertical: space[3],
  },
  divider: { borderBottomWidth: 1, borderBottomColor: c.outlineVariant },
  pressed: { backgroundColor: withAlpha(c.onSurface, stateLayer.pressed) },
});
