import { Text } from '@kapitwatt/ui';
import { useState, type MouseEvent, type ReactNode } from 'react';
import { View } from 'react-native';
import { useChartColors } from '../../hooks/useChartColors';
import { nonScaling, ticks, W } from '../../utils/plot';
import { Tooltip } from '../Tooltip';

type Hover = { xShare: number; yPx: number; lines: string[] } | null;

/**
 * A plot with a y axis (gridlines and labels from `yMax`), an SVG drawing area stretched to the
 * width, x labels, and an optional hover readout. `children` draws in a 1000 x height viewBox.
 */
export function Plot({
  height = 200,
  yMax,
  yFormat,
  xLabels,
  label,
  hover,
  children,
}: {
  height?: number;
  yMax: number;
  yFormat: (v: number) => string;
  xLabels: { at: number; text: string }[];
  label: string;
  hover?: (xShare: number) => Hover;
  children: (y: (v: number) => number) => ReactNode;
}) {
  const c = useChartColors();
  const [tip, setTip] = useState<Hover>(null);
  const top = 8;
  const bottom = height - 4;
  const y = (v: number) => bottom - (v / yMax) * (bottom - top);
  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!hover) return;
    const box = e.currentTarget.getBoundingClientRect();
    setTip(hover(Math.min(1, Math.max(0, (e.clientX - box.left) / box.width))));
  };
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <View style={{ width: 52, height }}>
        {ticks(yMax).map((v) => (
          <Text
            key={v}
            variant="labelSmall"
            color="onSurfaceVariant"
            style={{ position: 'absolute', right: 0, top: y(v) - 8 }}
          >
            {yFormat(v)}
          </Text>
        ))}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <div
          role="img"
          aria-label={label}
          style={{ position: 'relative', height }}
          onMouseMove={onMove}
          onMouseLeave={() => setTip(null)}
        >
          <svg
            width="100%"
            height={height}
            viewBox={`0 0 ${W} ${height}`}
            preserveAspectRatio="none"
            style={{ display: 'block', overflow: 'visible' }}
          >
            {ticks(yMax).map((v) => (
              <line
                key={v}
                x1={0}
                x2={W}
                y1={y(v)}
                y2={y(v)}
                stroke={c.grid}
                strokeWidth={1}
                {...nonScaling}
              />
            ))}
            {children(y)}
          </svg>
          {tip ? (
            <>
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: `${tip.xShare * 100}%`,
                  borderLeft: `1px solid ${c.baseline}`,
                  pointerEvents: 'none',
                }}
              />
              <Tooltip
                left={`${tip.xShare * 100}%`}
                top={Math.max(tip.yPx - 6, 18)}
                lines={tip.lines}
              />
            </>
          ) : null}
        </div>
        <View style={{ height: 20 }}>
          {xLabels.map((l) => (
            <Text
              key={`${l.at}-${l.text}`}
              variant="labelSmall"
              color="onSurfaceVariant"
              style={{
                position: 'absolute',
                top: 4,
                left: `${l.at * 100}%`,
                transform: [{ translateX: l.at <= 0 ? 0 : l.at >= 1 ? '-100%' : '-50%' }] as never,
                ...({ whiteSpace: 'nowrap' } as object), // web only: keep axis labels on one line
              }}
            >
              {l.text}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}
