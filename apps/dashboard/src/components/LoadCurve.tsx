import { useState, type CSSProperties, type MouseEvent } from 'react';
import { View } from 'react-native';
import { clock, kw } from '@/lib/format';
import { colors, font, space } from '@/theme';
import { LegendItem, Txt } from './ui';

/**
 * FR-DASH-14: the load of the committed households across the peak window, baseline
 * against actual, with the relief between them shaded and the forecast drawn dashed.
 *
 * The drop is a flat step, not a wiggly line, on purpose: the pilot verifies one average
 * kW per household for the window (two photos, or a smart-meter total), so that is all
 * the data there is. The y-axis starts just below the lowest line rather than at zero;
 * the baseline tick says so by naming the level.
 *
 * Web only, like the rest of the dashboard: the plot is a plain SVG.
 */

const W = 1000;
const H = 200;
/** Time shown either side of the window, as a share of its length. */
const MARGIN = 0.25;
const TOP = 24;
const BOTTOM = 176;

const ACTUAL = colors.series.deliveredPhoto;
const FORECAST = colors.series.committed;

export function LoadCurve({
  windowStart,
  windowEnd,
  baselineKw,
  forecastKw,
  deliveredKw,
  measured,
}: {
  windowStart: string;
  windowEnd: string;
  /** Summed baseline of the committed households. Left out when the API does not report it. */
  baselineKw?: number;
  /** Relief expected from what is committed. */
  forecastKw: number;
  /** Verified relief. Drawn once the window has ended. */
  deliveredKw: number;
  measured: boolean;
}) {
  const [hover, setHover] = useState<{ left: number; minute: number } | null>(null);

  const start = new Date(windowStart).getTime();
  const end = new Date(windowEnd).getTime();
  const span = Math.max(end - start, 60_000);
  const from = start - span * MARGIN;
  const total = span * (1 + 2 * MARGIN);

  const xs = (MARGIN / (1 + 2 * MARGIN)) * W;
  const xe = W - xs;
  // One scale for both lines: relief below the baseline, with headroom under the deeper one.
  const deepest = Math.max(forecastKw, measured ? deliveredKw : 0, 1) * 1.2;
  const y = (reliefKw: number) => TOP + (reliefKw / deepest) * (BOTTOM - TOP);
  const step = (reliefKw: number) =>
    `M0,${TOP} L${xs},${TOP} L${xs},${y(reliefKw)} L${xe},${y(reliefKw)} L${xe},${TOP} L${W},${TOP}`;

  /** A level as the operator reads it: a load when the baseline is known, else a drop. */
  const level = (reliefKw: number) =>
    baselineKw !== undefined
      ? `${kw(Math.max(0, Math.round(baselineKw - reliefKw)))} kW`
      : reliefKw > 0
        ? `−${kw(Math.round(reliefKw))} kW`
        : 'Baseline';
  const pct = (value: number, whole: number) => `${(value / whole) * 100}%` as const;

  const onMove = (event: MouseEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const share = Math.min(1, Math.max(0, (event.clientX - box.left) / box.width));
    setHover({ left: share * 100, minute: (from + share * total - start) / 60_000 });
  };
  const hoverTime = hover ? new Date(start + hover.minute * 60_000).toISOString() : null;
  const inWindow = hover !== null && hover.minute >= 0 && hover.minute <= span / 60_000;

  const summary =
    `Load of committed households from ${clock(windowStart)} to ${clock(windowEnd)}. ` +
    `Forecast relief ${kw(Math.round(forecastKw))} kW.` +
    (measured ? ` Verified relief ${kw(Math.round(deliveredKw))} kW.` : '');

  return (
    <View style={{ gap: space.sm }}>
      <View style={{ flexDirection: 'row', gap: space.md, flexWrap: 'wrap' }}>
        <LegendItem
          color={colors.muted}
          label={`Baseline${baselineKw !== undefined ? ` ${kw(Math.round(baselineKw))} kW` : ''}`}
        />
        <LegendItem
          color={FORECAST}
          label={`Forecast (dashed): ${kw(Math.round(forecastKw))} kW relief`}
        />
        <LegendItem
          color={ACTUAL}
          label={
            measured
              ? `Actual: ${kw(Math.round(deliveredKw))} kW verified relief`
              : 'Actual: measured after the window ends'
          }
        />
      </View>

      <View style={{ flexDirection: 'row', gap: space.sm }}>
        {/* y-axis: the baseline and the forecast level. */}
        <View style={{ width: 76, height: H }}>
          <Txt size="xs" tone="muted" numeric style={[tick, { top: TOP - 7 }]}>
            {baselineKw !== undefined ? `${kw(Math.round(baselineKw))} kW` : 'Baseline'}
          </Txt>
          {forecastKw > 0 ? (
            <Txt size="xs" tone="muted" numeric style={[tick, { top: y(forecastKw) - 7 }]}>
              {level(forecastKw)}
            </Txt>
          ) : null}
        </View>

        <div
          style={plot}
          role="img"
          aria-label={summary}
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
        >
          <svg
            width="100%"
            height={H}
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            style={{ display: 'block' }}
          >
            {/* The peak window. */}
            <rect x={xs} y={0} width={xe - xs} height={BOTTOM} fill={colors.surfaceAlt} />
            <line x1={xs} x2={xs} y1={0} y2={BOTTOM} stroke={colors.border} {...hairline} />
            <line x1={xe} x2={xe} y1={0} y2={BOTTOM} stroke={colors.border} {...hairline} />
            <line
              x1={0}
              x2={W}
              y1={BOTTOM}
              y2={BOTTOM}
              stroke={colors.borderStrong}
              {...hairline}
            />

            {/* Relief: the area between baseline and actual. */}
            {measured && deliveredKw > 0 ? (
              <rect
                x={xs}
                y={TOP}
                width={xe - xs}
                height={y(deliveredKw) - TOP}
                fill={ACTUAL}
                fillOpacity={0.16}
              />
            ) : null}

            <line
              x1={0}
              x2={W}
              y1={TOP}
              y2={TOP}
              stroke={colors.muted}
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={step(forecastKw)}
              fill="none"
              stroke={FORECAST}
              strokeWidth={2}
              strokeDasharray="6 4"
              vectorEffect="non-scaling-stroke"
            />
            {measured ? (
              <path
                d={step(deliveredKw)}
                fill="none"
                stroke={ACTUAL}
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
              />
            ) : null}
          </svg>

          {/* x-axis: the window's own start and end. */}
          <Txt size="xs" tone="muted" numeric style={[timeTick, { left: pct(xs, W) }]}>
            {clock(windowStart)}
          </Txt>
          <Txt size="xs" tone="muted" numeric style={[timeTick, { left: pct(xe, W) }]}>
            {clock(windowEnd)}
          </Txt>

          {hover && hoverTime ? (
            <>
              <div style={{ ...crosshair, left: `${hover.left}%` }} />
              <div
                style={{
                  ...tooltip,
                  ...(hover.left > 60
                    ? { right: `${100 - hover.left}%` }
                    : { left: `${hover.left}%` }),
                }}
              >
                <Txt size="xs" tone="ink" weight="600" numeric>
                  {clock(hoverTime)} · {inWindow ? 'peak window' : 'outside the window'}
                </Txt>
                <Txt size="xs" numeric>
                  Baseline: {level(0)}
                </Txt>
                <Txt size="xs" numeric>
                  Forecast: {level(inWindow ? forecastKw : 0)}
                </Txt>
                {measured ? (
                  <Txt size="xs" numeric>
                    Actual: {level(inWindow ? deliveredKw : 0)}
                  </Txt>
                ) : null}
              </div>
            </>
          ) : null}
        </div>
      </View>
    </View>
  );
}

const hairline = { strokeWidth: 1, vectorEffect: 'non-scaling-stroke' } as const;

const tick = { position: 'absolute', right: 0, textAlign: 'right' } as const;
const timeTick = { position: 'absolute', top: BOTTOM + 4, marginLeft: -20 } as const;

const plot: CSSProperties = { position: 'relative', flex: 1, minWidth: 0, height: H };
const crosshair: CSSProperties = {
  position: 'absolute',
  top: 0,
  height: BOTTOM,
  width: 0,
  borderLeft: `1px solid ${colors.borderStrong}`,
  pointerEvents: 'none',
};
const tooltip: CSSProperties = {
  position: 'absolute',
  top: 4,
  margin: '0 8px',
  padding: '6px 8px',
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  background: colors.surface,
  border: `1px solid ${colors.border}`,
  borderRadius: 6,
  boxShadow: '0 2px 8px rgba(31, 26, 21, 0.12)',
  fontFamily: font.family,
  pointerEvents: 'none',
  whiteSpace: 'nowrap',
};
