import { useTheme } from '@kapitwatt/hooks';
import { Text } from '@kapitwatt/ui';
import type { CSSProperties } from 'react';
import { View } from 'react-native';
import { ensureParamSliderCss } from '../styles/param-slider-css';

/**
 * A parameter: its name and value, a track, and an orange tick at the plan's default so any move
 * away from the plan shows at a glance.
 */
export function ParamSlider({
  label,
  hint,
  value,
  defaultValue,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  defaultValue: number;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  onChange: (value: number) => void;
}) {
  const t = useTheme();
  const c = t.color;
  ensureParamSliderCss(c.primary, c.focusRing, c.surfaceContainerLowest);
  const at = (v: number) => (max > min ? ((v - min) / (max - min)) * 100 : 0);
  const changed = Math.abs(value - defaultValue) > step / 2;
  const track: CSSProperties = {
    position: 'relative',
    zIndex: 1,
    background: `linear-gradient(to right, ${c.primary} ${at(value)}%, ${c.surfaceContainerHighest} ${at(value)}%)`,
  };
  return (
    <View style={{ gap: t.space[1] }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: t.space[2] }}>
        <Text variant="labelLarge" style={{ flex: 1 }}>
          {label}
        </Text>
        {changed ? (
          <Text variant="bodySmall" color="onSurfaceVariant">
            plan {format(defaultValue)}
          </Text>
        ) : null}
        <View
          style={{
            minWidth: 52,
            alignItems: 'center',
            paddingHorizontal: t.space[2],
            paddingVertical: 2,
            borderRadius: t.radius.sm,
            backgroundColor: changed ? c.secondaryContainer : c.surfaceContainerHigh,
          }}
        >
          <Text
            variant="labelLarge"
            color={changed ? 'onSecondaryContainer' : 'onSurfaceVariant'}
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {format(value)}
          </Text>
        </View>
      </View>
      <View style={{ height: 20, justifyContent: 'center' }}>
        {/* The plan's default, marked on the track (under the handle, which is drawn above it). */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: `${at(defaultValue)}%`,
            top: 2,
            bottom: 2,
            width: 2,
            marginLeft: -1,
            borderRadius: 1,
            backgroundColor: c.brandAccent,
          }}
        />
        <input
          type="range"
          className="kw-param"
          aria-label={label}
          aria-valuetext={format(value)}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={track}
        />
      </View>
      {hint ? (
        <Text variant="bodySmall" color="onSurfaceVariant">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
