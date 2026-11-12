import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { colors, font, radius, space } from '@/theme';

/** Small building blocks shared by every screen. Compact by default. */

type Tone = 'body' | 'ink' | 'muted' | 'faint';

export function Txt({
  tone = 'body',
  size = 'md',
  weight,
  numeric,
  style,
  ...rest
}: TextProps & {
  tone?: Tone;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'kpi';
  weight?: '400' | '500' | '600' | '700';
  /** Tabular figures, so columns of numbers line up. */
  numeric?: boolean;
}) {
  const base: TextStyle = {
    fontFamily: font.family,
    fontSize: font[size],
    color: colors[tone],
    fontWeight: weight ?? '400',
    ...(numeric ? { fontVariant: ['tabular-nums'] } : null),
  };
  return <Text {...rest} style={[base, style]} />;
}

/** Uppercase micro-label above a value or a group. */
export function Label({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return (
    <Txt size="xs" tone="muted" weight="600" style={[styles.label, style]}>
      {children}
    </Txt>
  );
}

export function Card({
  title,
  aside,
  children,
  style,
  padded = true,
}: {
  title?: string;
  aside?: ReactNode;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}) {
  return (
    <View style={[styles.card, style]}>
      {title ? (
        <View style={styles.cardHeader}>
          <Txt tone="ink" weight="600">
            {title}
          </Txt>
          {aside}
        </View>
      ) : null}
      <View style={padded ? styles.cardBody : null}>{children}</View>
    </View>
  );
}

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

export type TagTone = 'neutral' | 'brand' | 'good' | 'warning' | 'critical';

const tagTones: Record<TagTone, { bg: string; fg: string }> = {
  neutral: { bg: colors.status.neutralSoft, fg: colors.status.neutral },
  brand: { bg: colors.brandSoft, fg: colors.brandStrong },
  good: { bg: colors.status.goodSoft, fg: colors.status.good },
  warning: { bg: colors.status.warningSoft, fg: colors.status.warning },
  critical: { bg: colors.status.criticalSoft, fg: colors.status.critical },
};

/** A state, always spelled out: the colour never carries the meaning alone. */
export function Tag({ label, tone = 'neutral' }: { label: string; tone?: TagTone }) {
  const { bg, fg } = tagTones[tone];
  return (
    <View style={[styles.tag, { backgroundColor: bg }]}>
      <Txt size="xs" weight="600" style={{ color: fg }}>
        {label}
      </Txt>
    </View>
  );
}

/** One headline figure with its unit and a line of context. */
export function Stat({
  label,
  value,
  unit,
  note,
  children,
}: {
  label: string;
  value: string;
  unit?: string;
  note?: string;
  children?: ReactNode;
}) {
  return (
    <View style={styles.stat}>
      <Label>{label}</Label>
      <View style={styles.statValue}>
        <Txt size="kpi" tone="ink" weight="600" numeric>
          {value}
        </Txt>
        {unit ? (
          <Txt size="md" tone="muted" weight="500">
            {unit}
          </Txt>
        ) : null}
      </View>
      {note ? (
        <Txt size="sm" tone="muted" numeric>
          {note}
        </Txt>
      ) : null}
      {children}
    </View>
  );
}

export function Notice({
  tone = 'neutral',
  children,
}: {
  tone?: 'neutral' | 'warning' | 'critical' | 'brand';
  children: ReactNode;
}) {
  const { bg, fg } = tagTones[tone];
  return (
    <View style={[styles.notice, { backgroundColor: bg, borderColor: fg }]}>
      <Txt size="sm" style={{ color: fg }}>
        {children}
      </Txt>
    </View>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <View style={styles.pageHeader}>
      <View style={{ flexShrink: 1, gap: 2 }}>
        <Txt size="xl" tone="ink" weight="600" accessibilityRole="header">
          {title}
        </Txt>
        {subtitle ? (
          <Txt size="sm" tone="muted">
            {subtitle}
          </Txt>
        ) : null}
      </View>
      {actions ? <View style={styles.row}>{actions}</View> : null}
    </View>
  );
}

/** A swatch plus a name. Sits beside any chart with two or more series. */
export function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.swatch, { backgroundColor: color }]} />
      <Txt size="sm" tone="muted">
        {label}
      </Txt>
    </View>
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

export const styles = StyleSheet.create({
  label: { letterSpacing: 0.4, textTransform: 'uppercase' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
    minHeight: 40,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cardBody: { padding: space.lg },
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
  tag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  stat: { flexGrow: 1, flexBasis: 180, gap: 2, padding: space.lg },
  statValue: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  notice: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.md,
    borderLeftWidth: 3,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: space.lg,
    flexWrap: 'wrap',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 10, height: 10, borderRadius: 2 },
});
