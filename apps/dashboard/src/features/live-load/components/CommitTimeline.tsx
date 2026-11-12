import { useTheme } from '@kapitwatt/hooks';
import { withAlpha } from '@kapitwatt/tokens';
import { Text } from '@kapitwatt/ui';
import { memo, useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';
import { clock, kw } from '@/utils/format';
import { Legend } from '@/components/Legend';
import { Panel } from '@/components/Panel';
import { useLayoutValue } from '@/hooks/useLayoutValue';
import { motion } from '@/styles/motion';
import type { Sample } from '../hooks/useCommitSamples';

const H = 180;

/** The committed total climbing toward the target, while commitments come in. */
export const CommitTimeline = memo(function CommitTimeline({
  samples,
  target,
}: {
  samples: Sample[];
  target: number;
}) {
  const t = useTheme();
  const [width, onLayout] = useLayoutValue((w) => Math.round(w), 0);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const first = samples[0]?.at ?? now;
  const end = Math.max(now, first + 60_000);
  const top = Math.max(target, ...samples.map((s) => s.kw), 1) * 1.15;
  const x = (at: number) => ((at - first) / (end - first)) * width;
  const y = (v: number) => H - (v / top) * H;

  // A step line: a total holds until the next poll changes it, then runs on to now.
  let line = '';
  samples.forEach((s, i) => {
    line += i === 0 ? `M${x(s.at)},${y(s.kw)}` : `H${x(s.at)}V${y(s.kw)}`;
  });
  if (samples.length) line += `H${x(end)}`;
  const area = samples.length ? `${line}V${H}H${x(first)}Z` : '';
  const latest = samples[samples.length - 1]?.kw ?? 0;

  const svgProps: Record<string, unknown> =
    Platform.OS === 'web'
      ? {
          role: 'img',
          'aria-label': `Committed ${kw(Math.round(latest))} kW of ${kw(target)} kW target`,
        }
      : { accessibilityLabel: `Committed ${kw(Math.round(latest))} kW of ${kw(target)} kW target` };

  return (
    <Panel
      title="Commitments coming in"
      subtitle="Committed kW each time the page refreshes, recorded while it is open."
      aside={
        <Legend
          items={[
            { color: t.dataViz.committed, label: 'Committed' },
            { color: t.dataViz.target, label: 'Target' },
          ]}
        />
      }
      style={{ flex: 1 }}
    >
      <View style={{ gap: t.space[2] }}>
        <View style={[{ height: H }, motion.wipe]} onLayout={onLayout}>
          {width > 0 ? (
            <Svg width={width} height={H} {...svgProps}>
              {[0.25, 0.5, 0.75].map((f) => (
                <Line
                  key={f}
                  x1={0}
                  x2={width}
                  y1={H * f}
                  y2={H * f}
                  stroke={t.dataViz.grid}
                  strokeWidth={1}
                />
              ))}
              <Line
                x1={0}
                x2={width}
                y1={H - 0.5}
                y2={H - 0.5}
                stroke={t.color.outline}
                strokeWidth={1}
              />
              {area ? <Path d={area} fill={withAlpha(t.dataViz.committed, 0.12)} /> : null}
              {line ? (
                <Path
                  d={line}
                  stroke={t.dataViz.committed}
                  strokeWidth={2.5}
                  fill="none"
                  strokeLinejoin="round"
                />
              ) : null}
              <Line
                x1={0}
                x2={width}
                y1={y(target)}
                y2={y(target)}
                stroke={t.dataViz.target}
                strokeWidth={2}
                strokeDasharray="6 4"
              />
            </Svg>
          ) : null}
          {width > 0 ? (
            <Text
              variant="labelMedium"
              style={{
                position: 'absolute',
                right: 0,
                top: y(target) - 20,
                color: t.dataViz.target,
              }}
            >
              Target {kw(target)} kW
            </Text>
          ) : null}
          {samples.length === 0 ? (
            <Text
              variant="bodyMedium"
              color="onSurfaceVariant"
              style={{ position: 'absolute', left: 0, bottom: t.space[3] }}
            >
              Waiting for the first commitment.
            </Text>
          ) : null}
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text variant="bodySmall" color="onSurfaceVariant">
            {clock(new Date(first).toISOString())}
          </Text>
          <Text variant="bodySmall" color="onSurfaceVariant">
            Now
          </Text>
        </View>
      </View>
    </Panel>
  );
});
