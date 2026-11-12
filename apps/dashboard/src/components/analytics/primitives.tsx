import { useTheme } from '@kapitwatt/hooks';
import { Icon, type IconName } from '@kapitwatt/icons';
import { fontFamily, withAlpha } from '@kapitwatt/tokens';
import { Card, Divider, ProgressBar, Skeleton, SkeletonText, Stack, Text } from '@kapitwatt/ui';
import type { CSSProperties, ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';

/**
 * Building blocks for the analytics views, on the design system only: theme colour roles and the
 * dataViz palette (committed = primary, delivered = relief, target = tertiary), the type scale,
 * the 4-unit spacing and the shape scale. Flat, no shadows. Every chart also states its numbers in
 * text, so nothing depends on colour alone.
 */

/** Chart colours, from the theme. Smart meter and photo are a split of delivered, so they get two
 *  related hues that never collide with the reserved alert, simulated or brand colours. */
export function useChartColors() {
  const t = useTheme();
  return {
    committed: t.dataViz.committed,
    delivered: t.dataViz.delivered,
    target: t.dataViz.target,
    baseline: t.dataViz.baseline,
    grid: t.dataViz.grid,
    area: t.dataViz.reliefArea,
    ami: t.color.secondary,
    photo: t.color.relief,
    ink: t.color.onSurface,
    muted: t.color.onSurfaceVariant,
    surface: t.color.surface,
    track: t.color.surfaceContainerHighest,
    error: t.color.error,
    errorSoft: t.color.errorContainer,
    pending: t.color.outline,
  };
}

/** Font for SVG labels: the brand's Albert Sans, matching the type scale. */
export const svgFont = fontFamily.medium;

/** A rounded-up axis maximum on a 1, 2, 2.5, 4, 5, 6, 8 x 10^n ladder (each splits into 4 clean ticks). */
export function niceMax(value: number): number {
  if (value <= 0) return 1;
  const exp = 10 ** Math.floor(Math.log10(value));
  const f = value / exp;
  const step = [1, 2, 2.5, 4, 5, 6, 8, 10].find((s) => f <= s) ?? 10;
  return step * exp;
}

/** Evenly spaced axis ticks from 0 to max. */
export const ticks = (max: number, count = 4) =>
  Array.from({ length: count + 1 }, (_, i) => (max * i) / count);

/** A titled panel: the dashboard's outlined card with an icon, a title, an optional note and an aside. */
export function Panel({
  title,
  icon,
  note,
  aside,
  children,
  style,
  loading = false,
  skeleton,
}: {
  title: string;
  icon?: IconName;
  note?: string;
  aside?: ReactNode;
  children?: ReactNode;
  style?: ViewStyle;
  /** Skeleton in place of the body while its data loads; the header stays. */
  loading?: boolean;
  /** Shaped like the body; a plot by default. */
  skeleton?: ReactNode;
}) {
  return (
    <Card variant="outlined" padding={0} style={style}>
      <Stack direction="row" align="center" justify="space-between" gap={3} padding={4} wrap>
        <Stack direction="row" align="center" gap={2} style={{ flexShrink: 1 }}>
          {icon ? <Icon name={icon} size="sm" color="onSurfaceVariant" /> : null}
          <View style={{ flexShrink: 1 }}>
            <Text variant="titleMedium">{title}</Text>
            {note ? (
              <Text variant="bodySmall" color="onSurfaceVariant">
                {note}
              </Text>
            ) : null}
          </View>
        </Stack>
        {aside}
      </Stack>
      <Divider />
      <View style={{ padding: 16 }} accessibilityLabel={loading ? `${title}: loading` : undefined}>
        {loading ? (skeleton ?? <PlotSkeleton />) : children}
      </View>
    </Card>
  );
}

/** A headline figure: label, value in the data type style, unit, context, and optional target progress. */
export function KpiCard({
  label,
  icon,
  value,
  unit,
  caption,
  progress,
  loading = false,
}: {
  label: string;
  icon: IconName;
  value?: string;
  unit?: string;
  caption?: string;
  progress?: { share: number; tone: 'primary' | 'relief' | 'tertiary'; label: string };
  loading?: boolean;
}) {
  if (loading) {
    return (
      <Card variant="outlined" padding={4} style={{ flexGrow: 1, flexBasis: 160, minWidth: 150 }}>
        <Stack gap={2} accessibilityLabel={`${label}: loading`}>
          <Stack direction="row" align="center" gap={2}>
            <Icon name={icon} size="sm" color="onSurfaceVariant" />
            <Text variant="labelMedium" color="onSurfaceVariant">
              {label}
            </Text>
          </Stack>
          <Skeleton width={104} height={34} radius="sm" style={{ marginVertical: 2 }} />
          <SkeletonText lines={2} lineHeight={9} gap={6} />
        </Stack>
      </Card>
    );
  }
  return (
    <Card variant="outlined" padding={4} style={{ flexGrow: 1, flexBasis: 160, minWidth: 150 }}>
      <Stack gap={2}>
        <Stack direction="row" align="center" gap={2}>
          <Icon name={icon} size="sm" color="onSurfaceVariant" />
          <Text variant="labelMedium" color="onSurfaceVariant">
            {label}
          </Text>
        </Stack>
        <Stack direction="row" align="flex-end" gap={1}>
          <Text variant="dataMedium">{value}</Text>
          {unit ? (
            <Text variant="titleSmall" color="onSurfaceVariant" style={{ marginBottom: 6 }}>
              {unit}
            </Text>
          ) : null}
        </Stack>
        {progress ? (
          // The track runs to 125% so a value past target visibly crosses the target tick.
          <ProgressBar
            value={Math.min(progress.share / 1.25, 1)}
            target={1 / 1.25}
            tone={progress.tone}
            size="thin"
            accessibilityLabel={progress.label}
          />
        ) : null}
        {caption ? (
          <Text variant="bodySmall" color="onSurfaceVariant">
            {caption}
          </Text>
        ) : null}
      </Stack>
    </Card>
  );
}

/** A legend entry: swatch (or a dashed line) and a name. */
export function Legend({ items }: { items: { color: string; label: string; dashed?: boolean }[] }) {
  return (
    <Stack direction="row" gap={4} wrap>
      {items.map((item) => (
        <Stack key={item.label} direction="row" align="center" gap={2}>
          {item.dashed ? (
            <View
              style={{
                width: 16,
                borderTopWidth: 2,
                borderStyle: 'dashed',
                borderColor: item.color,
              }}
            />
          ) : (
            <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: item.color }} />
          )}
          <Text variant="labelMedium" color="onSurfaceVariant">
            {item.label}
          </Text>
        </Stack>
      ))}
    </Stack>
  );
}

/** A responsive row of panels that wraps on narrow screens. */
export function Row({ children }: { children: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, alignItems: 'stretch' }}>
      {children}
    </View>
  );
}

export const grow = (basis: number, weight = 1): ViewStyle => ({
  flexGrow: weight,
  flexBasis: basis,
  minWidth: Math.min(basis, 320),
});

/** Empty state inside a panel. */
export function Empty({ children }: { children: ReactNode }) {
  return (
    <Text variant="bodyMedium" color="onSurfaceVariant">
      {children}
    </Text>
  );
}

/** Hover tooltip for the SVG plots: inverse surface, like the design system's snackbars. */
export function Tooltip({ left, top, lines }: { left: string; top: number; lines: string[] }) {
  const t = useTheme();
  const style: CSSProperties = {
    position: 'absolute',
    left,
    top,
    transform: 'translate(-50%, -100%)',
    background: t.color.inverseSurface,
    color: t.color.inverseOnSurface,
    borderRadius: t.radius.sm,
    padding: '6px 10px',
    fontFamily: fontFamily.medium,
    fontSize: 12,
    lineHeight: '16px',
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    zIndex: 2,
  };
  return (
    <div style={style}>
      {lines.map((line) => (
        <div key={line}>{line}</div>
      ))}
    </div>
  );
}

/**
 * Share-of-target colour scale, shared by the map and the heat grid: the relief role at 100% or
 * more, stepping up in opacity from 50% (shares cluster between 50% and 100%, so the scale spends
 * its range there).
 */
export function useShareShade() {
  const t = useTheme();
  return (share: number) =>
    share >= 1
      ? t.color.relief
      : withAlpha(t.color.relief, 0.1 + Math.min(1, Math.max(0, (share - 0.5) / 0.5)) * 0.6);
}

/** Legend for the share-of-target scale. */
export function ShareScale() {
  const shade = useShareShade();
  return (
    <Stack direction="row" align="center" gap={2}>
      <Text variant="labelSmall" color="onSurfaceVariant">
        50% or less
      </Text>
      <View
        style={{ flexDirection: 'row', width: 160, height: 8, borderRadius: 4, overflow: 'hidden' }}
      >
        {[0.5, 0.625, 0.75, 0.875, 0.99, 1].map((s) => (
          <View key={s} style={{ flex: 1, backgroundColor: shade(s) }} />
        ))}
      </View>
      <Text variant="labelSmall" color="onSurfaceVariant">
        100%+ of target
      </Text>
    </Stack>
  );
}

/** Plot-shaped skeleton: a legend line, then columns of varied height on a baseline. */
export function PlotSkeleton({ height = 200 }: { height?: number }) {
  const t = useTheme();
  const bars = [0.4, 0.62, 0.5, 0.78, 0.58, 0.9, 0.48, 0.7, 0.6, 0.84, 0.66, 0.74];
  return (
    <Stack gap={3}>
      <Skeleton width={200} height={10} />
      <View
        style={{
          height,
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: 10,
          borderBottomWidth: 1,
          borderBottomColor: t.color.outlineVariant,
        }}
      >
        {bars.map((h, i) => (
          <View key={i} style={{ flex: 1, height: `${h * 100}%` }}>
            <Skeleton height="100%" radius="xs" />
          </View>
        ))}
      </View>
    </Stack>
  );
}

/** Skeleton for a list of label-and-value rows (rankings, comparisons, tables). */
export function RowsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Stack gap={3}>
      {Array.from({ length: rows }, (_, i) => (
        <Stack key={i} direction="row" align="center" gap={3}>
          <Skeleton width={[140, 110, 160, 120, 130][i % 5]} height={10} />
          <View style={{ flex: 1 }}>
            <Skeleton height={6} radius="full" />
          </View>
          <Skeleton width={40} height={10} />
        </Stack>
      ))}
    </Stack>
  );
}
