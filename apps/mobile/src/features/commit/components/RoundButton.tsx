import { Icon } from '@kapitwatt/icons';
import { themes } from '@kapitwatt/styles';
import { Pressable, StyleSheet } from 'react-native';

const c = themes.light.color;

/** The round outlined − and + buttons beside the figure. */
export function RoundButton(props: {
  icon: 'add' | 'remove';
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={props.label}
      accessibilityState={{ disabled: props.disabled }}
      disabled={props.disabled}
      onPress={props.onPress}
      style={({ pressed }) => [
        styles.round,
        props.disabled && styles.roundOff,
        pressed && styles.roundPressed,
      ]}
    >
      <Icon name={props.icon} weight="bold" color={props.disabled ? 'outline' : 'primary'} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  round: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: c.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundOff: { borderColor: c.outlineVariant },
  roundPressed: { backgroundColor: c.surfaceContainerHigh },
});
