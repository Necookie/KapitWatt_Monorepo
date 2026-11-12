import { themes } from '@kapitwatt/styles';
import { Text } from '@kapitwatt/ui';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { radius } from '@/styles/theme';

/**
 * The household app's button, built on the shared tokens but shaped for phones: every control in
 * the app is 56 px tall with 12 px corners, the same frame as a text field (mockup page 1, Log in).
 *
 *   primary   -> filled: the one main action on a screen
 *   secondary -> outlined: lower-emphasis actions
 *   demo      -> tonal: stand-ins for the operator, inside the demo controls box
 *   text      -> a text link with a 48 px touch target ("Forgot password?")
 */
type Variant = 'primary' | 'secondary' | 'demo' | 'text';

const t = themes.light;
const c = t.color;

const LOOK: Record<Variant, { bg: string; fg: string; border?: string }> = {
  primary: { bg: c.primary, fg: c.onPrimary },
  secondary: { bg: 'transparent', fg: c.primary, border: c.outline },
  demo: { bg: c.primaryContainer, fg: c.onPrimaryContainer },
  text: { bg: 'transparent', fg: c.primary },
};

/** `#RRGGBB` at an alpha, for M3 state layers (pressed 10%, disabled 12% / 38%). */
const alpha = (hex: string, a: number) =>
  `${hex}${Math.round(a * 255)
    .toString(16)
    .padStart(2, '0')}`;

export function Button(props: {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  /** Text buttons only: where the link sits in its column. */
  align?: 'start' | 'center' | 'end';
}) {
  const variant = props.variant ?? 'primary';
  const look = LOOK[variant];
  const off = !!props.disabled || !!props.loading;
  const isText = variant === 'text';
  const filled = look.bg !== 'transparent';
  const fg = off && !props.loading ? alpha(c.onSurface, t.stateLayer.disabledContent) : look.fg;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={props.label}
      accessibilityState={{ disabled: off, busy: !!props.loading }}
      disabled={off}
      onPress={props.onPress}
      style={[
        isText ? styles.text : styles.control,
        isText && { alignSelf: ALIGN[props.align ?? 'start'] },
        {
          backgroundColor:
            off && filled ? alpha(c.onSurface, t.stateLayer.disabledContainer) : look.bg,
          borderWidth: look.border ? t.borderWidth.hairline : 0,
          borderColor: off
            ? alpha(c.onSurface, t.stateLayer.disabledContainer)
            : (look.border ?? 'transparent'),
        },
      ]}
    >
      {({ pressed }) => (
        <View
          style={[
            styles.inner,
            isText && styles.innerText,
            pressed && !off ? { backgroundColor: alpha(look.fg, t.stateLayer.pressed) } : null,
          ]}
        >
          {props.loading ? (
            <ActivityIndicator color={look.fg} />
          ) : (
            <Text
              variant={isText ? 'titleSmall' : 'titleMedium'}
              numberOfLines={1}
              style={{ color: fg }}
            >
              {props.label}
            </Text>
          )}
        </View>
      )}
    </Pressable>
  );
}

const ALIGN = { start: 'flex-start', center: 'center', end: 'flex-end' } as const;

const styles = StyleSheet.create({
  control: {
    height: t.size.controlLg,
    alignSelf: 'stretch',
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  text: { height: t.size.touchTarget, borderRadius: radius.md, overflow: 'hidden' },
  inner: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  innerText: { paddingHorizontal: 12 },
});
