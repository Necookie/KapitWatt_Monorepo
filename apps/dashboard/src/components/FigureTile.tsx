import { useTheme, useWindowClass } from '@kapitwatt/hooks';
import { Icon, type IconName } from '@kapitwatt/icons';
import { ProgressBar, Text } from '@kapitwatt/ui';
import type { ReactNode } from 'react';
import { View } from 'react-native';

export type Tile = {
  label: string;
  icon: IconName;
  /** Already formatted (or a counting Tally); undefined shows a dash (not measured yet). */
  value?: ReactNode;
  unit?: string;
  note: string;
  bg: string;
  fg: string;
  /** An assumption, not a measurement: dashed edge on the plain surface. */
  dashed?: boolean;
  /** lg: the lead figure of a bento column. */
  size?: 'md' | 'lg';
  /** A bar against the target under the figure, for a lead tile with room for it. */
  progress?: { value: number; target: number; label: string };
};

export function FigureTile({
  label,
  icon,
  value,
  unit = 'kW',
  note,
  bg,
  fg,
  dashed,
  size = 'md',
  progress,
}: Tile) {
  const t = useTheme();
  // Two by two on a phone, one row of four from medium up.
  const compact = useWindowClass() === 'compact';
  return (
    <View
      style={{
        flex: 1,
        gap: t.space[compact ? 2 : 3],
        padding: t.space[compact ? 4 : 5],
        borderRadius: t.radius.lg,
        backgroundColor: bg,
        borderWidth: dashed ? t.borderWidth.strong : 0,
        borderStyle: 'dashed',
        borderColor: t.color.outline,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[2] }}>
        <Icon name={icon} size="sm" color={fg} />
        <Text variant="labelLarge" style={{ color: fg }}>
          {label}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: t.space[1] }}>
        <Text variant={size === 'lg' ? 'dataLarge' : 'dataMedium'} style={{ color: fg }}>
          {value ?? '—'}
        </Text>
        {unit ? (
          <Text variant="titleSmall" style={{ color: fg, opacity: 0.8 }}>
            {unit}
          </Text>
        ) : null}
      </View>
      {/* Bar and note sit at the foot when the tile is stretched to its bento cell. */}
      <View style={{ marginTop: 'auto', gap: t.space[2] }}>
        {progress ? (
          <ProgressBar
            size="thick"
            value={progress.value}
            target={progress.target}
            accessibilityLabel={progress.label}
          />
        ) : null}
        <Text variant="bodySmall" style={{ color: fg, opacity: 0.85 }}>
          {note}
        </Text>
      </View>
    </View>
  );
}
