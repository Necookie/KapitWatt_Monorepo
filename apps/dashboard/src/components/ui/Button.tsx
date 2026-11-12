import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { colors, radius, space } from '@/styles/theme';
import { Txt } from './Txt';

export function Button({
  label,
  onPress,
  kind = 'secondary',
  disabled,
  busy,
  small,
}: {
  label: string;
  onPress: () => void;
  kind?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  busy?: boolean;
  small?: boolean;
}) {
  const off = disabled || busy;
  const onDark = kind === 'primary' || kind === 'danger';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(off), busy: Boolean(busy) }}
      disabled={off}
      onPress={onPress}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
        styles.button,
        small ? styles.buttonSmall : null,
        buttonKinds[kind],
        hovered && !off ? buttonHover[kind] : null,
        pressed ? styles.pressed : null,
        off ? styles.disabled : null,
      ]}
    >
      {busy ? (
        <ActivityIndicator size="small" color={onDark ? '#FFFFFF' : colors.brandStrong} />
      ) : null}
      <Txt
        size={small ? 'sm' : 'md'}
        weight="600"
        style={{ color: onDark ? '#FFFFFF' : kind === 'ghost' ? colors.brandStrong : colors.ink }}
      >
        {label}
      </Txt>
    </Pressable>
  );
}

const buttonKinds = StyleSheet.create({
  primary: { backgroundColor: colors.brandStrong, borderColor: colors.brandStrong },
  secondary: { backgroundColor: colors.surface, borderColor: colors.borderStrong },
  danger: { backgroundColor: colors.status.critical, borderColor: colors.status.critical },
  ghost: { backgroundColor: 'transparent', borderColor: 'transparent' },
});

const buttonHover = StyleSheet.create({
  primary: { backgroundColor: '#A94307' },
  secondary: { backgroundColor: colors.surfaceAlt },
  danger: { backgroundColor: '#971C13' },
  ghost: { backgroundColor: colors.brandSoft },
});

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    height: 32,
    paddingHorizontal: space.md,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  buttonSmall: { height: 26, paddingHorizontal: space.sm },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.45 },
});
