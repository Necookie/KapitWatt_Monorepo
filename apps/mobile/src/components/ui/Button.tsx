import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, space, text } from '@/theme';

type Variant = 'primary' | 'secondary' | 'demo';

const bg: Record<Variant, string> = {
  primary: colors.teal,
  secondary: colors.surface,
  /** Amber marks demo-only controls (plan colour convention). */
  demo: colors.amber,
};
const fg: Record<Variant, string> = {
  primary: colors.onDark,
  secondary: colors.ink,
  demo: colors.navy,
};

export function Button(props: {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
}) {
  const variant = props.variant ?? 'primary';
  const inactive = props.disabled || props.loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: props.loading }}
      disabled={inactive}
      onPress={props.onPress}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: bg[variant] },
        inactive && styles.inactive,
        pressed && styles.pressed,
      ]}
    >
      {props.loading ? (
        <ActivityIndicator color={fg[variant]} />
      ) : (
        <Text style={[styles.label, { color: fg[variant] }]}>{props.label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { ...text.body, fontWeight: '700' },
  inactive: { opacity: 0.4 },
  pressed: { opacity: 0.8 },
});
