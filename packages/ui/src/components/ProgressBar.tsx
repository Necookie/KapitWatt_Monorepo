import { useTheme } from '@kapitwatt/hooks';
import { View } from 'react-native';

export type ProgressBarProps = {
  /** 0 to 1. Values above 1 fill the bar (a barangay can beat its target). */
  value: number;
  /** Optional target marker, 0 to 1 (target kW / bar maximum). */
  target?: number;
  tone?: 'primary' | 'relief' | 'tertiary';
  /** thin = 4 (inline), thick = 12 (barangay progress on the event screen). */
  size?: 'thin' | 'thick';
  accessibilityLabel: string;
};

export function ProgressBar({
  value,
  target,
  tone = 'primary',
  size = 'thin',
  accessibilityLabel,
}: ProgressBarProps) {
  const t = useTheme();
  const v = Math.min(1, Math.max(0, value));
  const h = size === 'thick' ? 12 : 4;
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
      style={{ alignSelf: 'stretch', height: h + 8, justifyContent: 'center' }}
    >
      <View
        style={{
          height: h,
          borderRadius: t.radius.full,
          backgroundColor: t.color.surfaceContainerHighest,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: `${v * 100}%`,
            height: '100%',
            borderRadius: t.radius.full,
            backgroundColor: t.color[tone],
          }}
        />
      </View>
      {target != null ? (
        <View
          style={{
            position: 'absolute',
            left: `${Math.min(1, Math.max(0, target)) * 100}%`,
            top: 0,
            bottom: 0,
            width: 2,
            marginLeft: -1,
            borderRadius: 1,
            backgroundColor: t.color.onSurface,
          }}
        />
      ) : null}
    </View>
  );
}
