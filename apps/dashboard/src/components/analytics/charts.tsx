import { useTheme } from '@kapitwatt/hooks';
import type {
  AlertAnalytics,
  AlertHistoryItem,
  AnalyticsOutcome,
  BarangayTotals,
  SimParams,
} from '@kapitwatt/shared';
import { expectedOutcome } from '@kapitwatt/sim';
import { withAlpha } from '@kapitwatt/tokens';
import { Chip, ProgressBar, Stack, Text } from '@kapitwatt/ui';
import { useState, type MouseEvent, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { count, dayAndClock, fraction, kw, percent, php } from '@/lib/format';
import {
  Empty,
  Legend,
  ShareScale,
  Tooltip,
  niceMax,
  svgFont,
  ticks,
  useChartColors,
  useShareShade,
} from './primitives';

const W = 1000;
const nonScaling = { vectorEffect: 'non-scaling-stroke' as const };

// ---- Plot frame -------------------------------------------------------------------------------

type Hover = { xShare: number; yPx: number; lines: string[] } | null;

/**
 * A plot with a y axis (gridlines and labels from `yMax`), an SVG drawing area stretched to the
 * width, x labels, and an optional hover readout. `children` draws in a 1000 x height viewBox.
 */
function Plot({
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

const time = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-PH', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  });

// ---- Overview ---------------------------------------------------------------------------------

/** Committed kW over the commit phase as a step area, against the target, with a hover readout. */
export function CommitTimeline({
  timeline,
  targetKw,
}: {
  timeline: AlertAnalytics['timeline'];
  targetKw: number;
}) {
  const c = useChartColors();
  if (timeline.length === 0) return <Empty>No commitments yet.</Empty>;
  const t0 = new Date(timeline[0]!.at).getTime();
  const t1 = new Date(timeline[timeline.length - 1]!.at).getTime();
  const span = Math.max(t1 - t0, 1);
  const xs = (iso: string) => ((new Date(iso).getTime() - t0) / span) * W;
  const last = timeline[timeline.length - 1]!;
  const yMax = niceMax(Math.max(targetKw, last.committedKw) * 1.05);
  const crossing = timeline.find((p) => p.committedKw >= targetKw);
  return (
    <Stack gap={3}>
      <Legend
        items={[
          {
            color: c.committed,
            label: `Committed: ${kw(last.committedKw)} kW from ${count(last.households)} households`,
          },
          { color: c.target, label: `Target: ${kw(targetKw)} kW`, dashed: true },
        ]}
      />
      <Plot
        height={220}
        yMax={yMax}
        yFormat={(v) => `${kw(v)}`}
        xLabels={[
          { at: 0, text: time(timeline[0]!.at) },
          ...(crossing
            ? [{ at: xs(crossing.at) / W, text: `Target reached ${time(crossing.at)}` }]
            : []),
          { at: 1, text: time(last.at) },
        ]}
        label={`Committed load rose to ${kw(last.committedKw)} kW against a ${kw(targetKw)} kW target${crossing ? `, reaching it at ${time(crossing.at)}` : ''}.`}
        hover={(share) => {
          const at = t0 + share * span;
          const p =
            [...timeline].reverse().find((q) => new Date(q.at).getTime() <= at) ?? timeline[0]!;
          return {
            xShare: share,
            yPx: 220 - 4 - (p.committedKw / yMax) * (220 - 12),
            lines: [
              time(p.at),
              `${kw(p.committedKw)} kW committed`,
              `${count(p.households)} households`,
            ],
          };
        }}
      >
        {(y) => {
          const line = timeline
            .map((p, i) =>
              i === 0 ? `M0,${y(p.committedKw)}` : `H${xs(p.at)} V${y(p.committedKw)}`,
            )
            .join(' ');
          return (
            <>
              <path d={`${line} H${W} V${y(0)} H0 Z`} fill={withAlpha(c.committed, 0.12)} />
              <path
                d={`${line} H${W}`}
                fill="none"
                stroke={c.committed}
                strokeWidth={2.5}
                {...nonScaling}
              />
              <line
                x1={0}
                x2={W}
                y1={y(targetKw)}
                y2={y(targetKw)}
                stroke={c.target}
                strokeWidth={2}
                strokeDasharray="6 5"
                {...nonScaling}
              />
            </>
          );
        }}
      </Plot>
    </Stack>
  );
}

/** Delivered as a share of target on a half-circle gauge running to 125%, with the 100% mark. */
export function TargetGauge({
  deliveredKw,
  targetKw,
  settled,
}: {
  deliveredKw: number;
  targetKw: number;
  settled: boolean;
}) {
  const c = useChartColors();
  const share = targetKw > 0 ? deliveredKw / targetKw : 0;
  const scale = 1.25;
  const r = 80;
  const cx = 100;
  const cy = 96;
  const point = (f: number) => {
    const a = Math.PI * (1 - Math.min(f, scale) / scale);
    return [cx + r * Math.cos(a), cy - r * Math.sin(a)] as const;
  };
  const arc = (from: number, to: number) => {
    const [x1, y1] = point(from);
    const [x2, y2] = point(to);
    return `M${x1},${y1} A${r},${r} 0 0 1 ${x2},${y2}`;
  };
  const [tx1, ty1] = [
    cx + (r - 14) * Math.cos(Math.PI * (1 - 1 / scale)),
    cy - (r - 14) * Math.sin(Math.PI * (1 - 1 / scale)),
  ];
  const [tx2, ty2] = [
    cx + (r + 14) * Math.cos(Math.PI * (1 - 1 / scale)),
    cy - (r + 14) * Math.sin(Math.PI * (1 - 1 / scale)),
  ];
  const hit = share >= 1;
  return (
    <Stack align="center" gap={1}>
      <svg
        viewBox="0 0 200 116"
        width="100%"
        style={{ maxWidth: 320 }}
        role="img"
        aria-label={`Delivered ${percent(deliveredKw, targetKw)} of target`}
      >
        <path
          d={arc(0, scale)}
          fill="none"
          stroke={c.track}
          strokeWidth={18}
          strokeLinecap="round"
        />
        {share > 0 ? (
          <path
            d={arc(0, share)}
            fill="none"
            stroke={hit ? c.delivered : c.committed}
            strokeWidth={18}
            strokeLinecap="round"
          />
        ) : null}
        <line x1={tx1} y1={ty1} x2={tx2} y2={ty2} stroke={c.target} strokeWidth={3} />
        <text
          x={cx}
          y={cy - 18}
          textAnchor="middle"
          fontFamily={svgFont}
          fontSize={30}
          fill={c.ink}
        >
          {Math.round(share * 100)}%
        </text>
        <text
          x={cx}
          y={cy + 2}
          textAnchor="middle"
          fontFamily={svgFont}
          fontSize={11}
          fill={c.muted}
        >
          of target
        </text>
      </svg>
      <Text variant="bodyMedium" color="onSurfaceVariant" align="center">
        {kw(deliveredKw)} of {kw(targetKw)} kW {settled ? 'verified' : 'so far'}
      </Text>
      <View style={{ alignSelf: 'center' }}>
        <Chip
          label={hit ? 'Target reached' : `${kw(Math.max(0, targetKw - deliveredKw))} kW short`}
          tone={hit ? 'relief' : 'neutral'}
        />
      </View>
    </Stack>
  );
}

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

/** A donut with a centre figure and a legend that states every value and share. */
export function Donut({
  segments,
  center,
  centerCaption,
  format,
}: {
  segments: DonutSegment[];
  center: string;
  centerCaption: string;
  format: (v: number) => string;
}) {
  const c = useChartColors();
  const shown = segments.filter((s) => s.value > 0);
  const total = shown.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) return <Empty>Nothing to show yet.</Empty>;
  const r = 56;
  const circumference = 2 * Math.PI * r;
  const gap = shown.length > 1 ? 3 : 0;
  let offset = 0;
  return (
    <Stack direction="row" align="center" gap={6} wrap>
      <svg
        viewBox="0 0 150 150"
        width={168}
        height={168}
        role="img"
        aria-label={shown.map((s) => `${s.label} ${percent(s.value, total)}`).join(', ')}
      >
        <circle cx={75} cy={75} r={r} fill="none" stroke={c.track} strokeWidth={20} />
        {shown.map((s) => {
          const length = (s.value / total) * circumference;
          const dash = Math.max(length - gap, 0.5);
          const el = (
            <circle
              key={s.label}
              cx={75}
              cy={75}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={20}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 75 75)"
            />
          );
          offset += length;
          return el;
        })}
        <text x={75} y={74} textAnchor="middle" fontFamily={svgFont} fontSize={20} fill={c.ink}>
          {center}
        </text>
        <text x={75} y={92} textAnchor="middle" fontFamily={svgFont} fontSize={10} fill={c.muted}>
          {centerCaption}
        </text>
      </svg>
      <Stack gap={2} style={{ flexGrow: 1, minWidth: 180 }}>
        {shown.map((s) => (
          <Stack key={s.label} direction="row" align="center" justify="space-between" gap={4}>
            <Stack direction="row" align="center" gap={2}>
              <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: s.color }} />
              <Text variant="bodyMedium">{s.label}</Text>
            </Stack>
            <Text variant="labelLarge" color="onSurfaceVariant">
              {format(s.value)} · {percent(s.value, total)}
            </Text>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}

// ---- Verification -----------------------------------------------------------------------------

const STAGES: Record<AlertAnalytics['funnel'][number]['stage'], { label: string; hint: string }> = {
  committed: { label: 'Committed', hint: 'Households that committed a cut' },
  evidence_started: {
    label: 'Evidence started',
    hint: 'Before photo sent, or meter data arriving',
  },
  evidence_complete: {
    label: 'Evidence complete',
    hint: 'Both photos passed, or enough meter data',
  },
  verified: { label: 'Verified', hint: 'Settled with a verified cut' },
};

/** Households at each verification stage, smart meter and photo stacked, with step conversion. */
export function VerificationFunnel({
  funnel,
  settled,
}: {
  funnel: AlertAnalytics['funnel'];
  settled: boolean;
}) {
  const c = useChartColors();
  const t = useTheme();
  const total = (funnel[0]?.ami ?? 0) + (funnel[0]?.photo ?? 0);
  if (total === 0) return <Empty>No commitments yet.</Empty>;
  return (
    <Stack gap={4}>
      <Legend
        items={[
          { color: c.ami, label: 'Smart meter' },
          { color: c.photo, label: 'Meter photo' },
        ]}
      />
      {funnel.map((row, i) => {
        const n = row.ami + row.photo;
        const prev = i === 0 ? n : funnel[i - 1]!.ami + funnel[i - 1]!.photo;
        const pending = row.stage === 'verified' && !settled;
        return (
          <View key={row.stage} style={{ gap: 6 }}>
            <Stack direction="row" justify="space-between" align="flex-end" gap={3}>
              <View style={{ flexShrink: 1 }}>
                <Text variant="titleSmall">{STAGES[row.stage].label}</Text>
                <Text variant="bodySmall" color="onSurfaceVariant">
                  {STAGES[row.stage].hint}
                </Text>
              </View>
              {pending ? (
                <Chip label="After settlement" tone="neutral" />
              ) : (
                <Stack direction="row" align="center" gap={2}>
                  {i > 0 && prev > n ? <Chip label={`−${count(prev - n)}`} tone="neutral" /> : null}
                  <Text variant="dataSmall">{count(n)}</Text>
                  <Text variant="labelMedium" color="onSurfaceVariant">
                    {percent(n, total)}
                  </Text>
                </Stack>
              )}
            </Stack>
            <View
              style={{
                flexDirection: 'row',
                height: 12,
                borderRadius: t.radius.full,
                overflow: 'hidden',
                backgroundColor: c.track,
              }}
            >
              {pending ? null : (
                <>
                  <View style={{ width: `${(row.ami / total) * 100}%`, backgroundColor: c.ami }} />
                  <View
                    style={{
                      width: `${(row.photo / total) * 100}%`,
                      backgroundColor: c.photo,
                      marginLeft: row.ami > 0 ? 2 : 0,
                    }}
                  />
                </>
              )}
            </View>
          </View>
        );
      })}
    </Stack>
  );
}

/** What became of every commitment. Failures use the error role; nothing reuses the alert colours. */
export function useOutcomeSegments(outcomes: AlertAnalytics['outcomes']): DonutSegment[] {
  const c = useChartColors();
  const spec: Record<AnalyticsOutcome, { label: string; color: string }> = {
    verified: { label: 'Verified', color: c.delivered },
    awaiting_settlement: { label: 'Awaiting settlement', color: c.committed },
    pending_review: { label: 'Held for review', color: c.ami },
    missing_photo: { label: 'Missing photo', color: c.error },
    late_photo: { label: 'Late photo', color: withAlpha(c.error, 0.7) },
    failed_check: { label: 'Failed a check', color: withAlpha(c.error, 0.45) },
    no_measured_cut: { label: 'No measured cut', color: c.pending },
    missing_ami_data: { label: 'Missing meter data', color: withAlpha(c.pending, 0.6) },
  };
  const order = Object.keys(spec) as AnalyticsOutcome[];
  return [...outcomes]
    .sort((a, b) => order.indexOf(a.outcome) - order.indexOf(b.outcome))
    .map((o) => ({
      label: spec[o.outcome].label,
      value: o.households,
      color: spec[o.outcome].color,
    }));
}

/** Smart meter vs photo, side by side: the case for smart meters in numbers. */
export function PathComparison({ paths }: { paths: AlertAnalytics['paths'] }) {
  const c = useChartColors();
  const rows: { path: 'ami' | 'photo'; label: string; color: string }[] = [
    { path: 'ami', label: 'Smart meter', color: c.ami },
    { path: 'photo', label: 'Meter photo', color: c.photo },
  ];
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
      {rows.map(({ path, label, color }) => {
        const p = paths.find((x) => x.path === path);
        const rate =
          p && p.committedHouseholds > 0 ? p.verifiedHouseholds / p.committedHouseholds : 0;
        const perKwh = p && p.verifiedKwh > 0 ? p.paidPhp / p.verifiedKwh : null;
        return (
          <View key={path} style={{ flexGrow: 1, flexBasis: 260, gap: 10 }}>
            <Stack direction="row" align="center" gap={2}>
              <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: color }} />
              <Text variant="titleSmall">{label}</Text>
            </Stack>
            <Stack direction="row" justify="space-between">
              <Text variant="bodyMedium" color="onSurfaceVariant">
                Verified
              </Text>
              <Text variant="labelLarge">
                {count(p?.verifiedHouseholds ?? 0)} of {count(p?.committedHouseholds ?? 0)} ·{' '}
                {fraction(rate)}
              </Text>
            </Stack>
            <View
              accessibilityLabel={`${label} verified ${fraction(rate)}`}
              style={{ height: 6, borderRadius: 3, backgroundColor: c.track, overflow: 'hidden' }}
            >
              <View
                style={{
                  width: `${Math.min(rate, 1) * 100}%`,
                  height: '100%',
                  backgroundColor: color,
                }}
              />
            </View>
            <Stack direction="row" justify="space-between">
              <Text variant="bodyMedium" color="onSurfaceVariant">
                Verified energy
              </Text>
              <Text variant="labelLarge">{kw(p?.verifiedKwh ?? 0)} kWh</Text>
            </Stack>
            <Stack direction="row" justify="space-between">
              <Text variant="bodyMedium" color="onSurfaceVariant">
                Paid
              </Text>
              <Text variant="labelLarge">
                {php(p?.paidPhp ?? 0)}
                {perKwh !== null ? ` · ${php(perKwh)}/kWh` : ''}
              </Text>
            </Stack>
          </View>
        );
      })}
    </View>
  );
}

// ---- Barangays --------------------------------------------------------------------------------

const shareOf = (b: BarangayTotals) => (b.targetKw > 0 ? b.deliveredKw / b.targetKw : 0);

/**
 * Town x barangay grid, each tile shaded by its share of target: a map-like overview of the pilot
 * without a basemap. Tiles that reached target use the relief role; the rest step up from the surface.
 */
export function BarangayHeatGrid({ barangays }: { barangays: BarangayTotals[] }) {
  const t = useTheme();
  const shade = useShareShade();
  if (barangays.length === 0) return <Empty>No barangays targeted.</Empty>;
  const towns = [...new Set(barangays.map((b) => b.municipality))];
  return (
    <Stack gap={3}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {towns.map((town) => (
          <View key={town} style={{ flexGrow: 1, flexBasis: 140, gap: 6 }}>
            <Text variant="labelLarge" color="onSurfaceVariant">
              {town}
            </Text>
            {barangays
              .filter((b) => b.municipality === town)
              .map((b) => {
                const share = shareOf(b);
                const hit = share >= 1;
                return (
                  <View
                    key={b.barangayId}
                    accessibilityLabel={`${b.name}, ${town}: ${percent(b.deliveredKw, b.targetKw)} of target`}
                    style={{
                      borderRadius: t.radius.sm,
                      padding: 10,
                      backgroundColor: shade(share),
                      minHeight: 58,
                      justifyContent: 'space-between',
                    }}
                  >
                    <Text
                      variant="labelMedium"
                      color={hit ? 'onRelief' : 'onSurface'}
                      numberOfLines={1}
                    >
                      {b.name}
                    </Text>
                    <Text variant="titleMedium" color={hit ? 'onRelief' : 'onSurface'}>
                      {percent(b.deliveredKw, b.targetKw)}
                    </Text>
                  </View>
                );
              })}
          </View>
        ))}
      </View>
      <ShareScale />
    </Stack>
  );
}

/**
 * Committed vs delivered kW per barangay. Points on the dashed line delivered everything they
 * committed; the further below it, the more was lost. Point size is the barangay's households.
 */
export function CommitDeliverScatter({ barangays }: { barangays: BarangayTotals[] }) {
  const c = useChartColors();
  const [hover, setHover] = useState<BarangayTotals | null>(null);
  if (barangays.length === 0) return <Empty>No barangays targeted.</Empty>;
  const max = niceMax(
    Math.max(...barangays.map((b) => Math.max(b.committedKw, b.deliveredKw)), 1) * 1.05,
  );
  const H = 360;
  const size = (b: BarangayTotals) => 4 + Math.sqrt(b.households ?? 1) * 0.55;
  return (
    <Stack gap={3}>
      <Legend
        items={[
          { color: c.delivered, label: 'Reached target' },
          { color: c.committed, label: 'Below target' },
          { color: c.baseline, label: 'Delivered = committed', dashed: true },
        ]}
      />
      <Plot
        height={H}
        yMax={max}
        yFormat={(v) => kw(v)}
        xLabels={[
          { at: 0, text: '0' },
          { at: 0.5, text: `${kw(max / 2)} kW committed` },
          { at: 1, text: `${kw(max)}` },
        ]}
        label="Committed against delivered kW for each barangay."
        hover={(share) => {
          const xKw = share * max;
          const nearest = [...barangays].sort(
            (a, b) => Math.abs(a.committedKw - xKw) - Math.abs(b.committedKw - xKw),
          )[0]!;
          setHover(nearest);
          return {
            xShare: nearest.committedKw / max,
            yPx: H - 4 - (nearest.deliveredKw / max) * (H - 12),
            lines: [
              `${nearest.name}, ${nearest.municipality}`,
              `${kw(nearest.committedKw)} kW committed`,
              `${kw(nearest.deliveredKw)} kW delivered (${percent(nearest.deliveredKw, nearest.committedKw)})`,
            ],
          };
        }}
      >
        {(y) => (
          <>
            <line
              x1={0}
              y1={y(0)}
              x2={W}
              y2={y(max)}
              stroke={c.baseline}
              strokeWidth={1.5}
              strokeDasharray="5 5"
              {...nonScaling}
            />
            {barangays.map((b) => {
              const cx = (b.committedKw / max) * W;
              const r = size(b);
              const active = hover?.barangayId === b.barangayId;
              return (
                <ellipse
                  key={b.barangayId}
                  cx={cx}
                  cy={y(b.deliveredKw)}
                  rx={r * (W / 700)}
                  ry={r}
                  fill={withAlpha(b.targetHit ? c.delivered : c.committed, active ? 0.95 : 0.55)}
                  stroke={b.targetHit ? c.delivered : c.committed}
                  strokeWidth={1}
                  {...nonScaling}
                />
              );
            })}
          </>
        )}
      </Plot>
    </Stack>
  );
}

/** Every barangay ranked by share of target on the design system's progress bar, target marked. */
export function BarangayRanking({ barangays }: { barangays: BarangayTotals[] }) {
  if (barangays.length === 0) return <Empty>No barangays targeted.</Empty>;
  const rows = [...barangays].sort((a, b) => shareOf(b) - shareOf(a));
  return (
    <Stack gap={2}>
      {rows.map((b, i) => (
        <Stack key={b.barangayId} direction="row" align="center" gap={3}>
          <Text
            variant="labelMedium"
            color="onSurfaceVariant"
            style={{ width: 20, textAlign: 'right' }}
          >
            {i + 1}
          </Text>
          <Text variant="labelLarge" numberOfLines={1} style={{ width: 210 }}>
            {b.name}
            <Text variant="labelMedium" color="onSurfaceVariant">
              {' '}
              · {b.municipality}
            </Text>
          </Text>
          <View style={{ flex: 1 }}>
            <ProgressBar
              value={Math.min(shareOf(b) / 1.25, 1)}
              target={1 / 1.25}
              tone={b.targetHit ? 'relief' : 'primary'}
              accessibilityLabel={`${b.name} ${percent(b.deliveredKw, b.targetKw)} of target`}
            />
          </View>
          <Text variant="labelLarge" style={{ width: 48, textAlign: 'right' }}>
            {percent(b.deliveredKw, b.targetKw)}
          </Text>
        </Stack>
      ))}
    </Stack>
  );
}

/** Totals by town: households, committed, delivered, share of target, barangays at target. */
export function TownTable({ barangays }: { barangays: BarangayTotals[] }) {
  const t = useTheme();
  const towns = [...new Set(barangays.map((b) => b.municipality))].map((town) => {
    const rows = barangays.filter((b) => b.municipality === town);
    const sum = (k: 'targetKw' | 'committedKw' | 'deliveredKw') =>
      rows.reduce((s, b) => s + b[k], 0);
    return {
      town,
      households: rows.reduce((s, b) => s + (b.households ?? 0), 0),
      target: sum('targetKw'),
      committed: sum('committedKw'),
      delivered: sum('deliveredKw'),
      hit: rows.filter((b) => b.targetHit).length,
      count: rows.length,
    };
  });
  towns.sort(
    (a, b) => b.delivered / Math.max(b.target, 1e-9) - a.delivered / Math.max(a.target, 1e-9),
  );
  const cols = [
    { key: 'town', label: 'Town', flex: 1.4, align: 'left' as const },
    { key: 'households', label: 'Households', flex: 1, align: 'right' as const },
    { key: 'committed', label: 'Committed', flex: 1, align: 'right' as const },
    { key: 'delivered', label: 'Delivered', flex: 1, align: 'right' as const },
    { key: 'share', label: 'Of target', flex: 0.9, align: 'right' as const },
    { key: 'hit', label: 'At target', flex: 0.9, align: 'right' as const },
  ];
  const cell = (row: (typeof towns)[number], key: string) =>
    key === 'town'
      ? row.town
      : key === 'households'
        ? count(row.households)
        : key === 'committed'
          ? `${kw(row.committed)} kW`
          : key === 'delivered'
            ? `${kw(row.delivered)} kW`
            : key === 'share'
              ? percent(row.delivered, row.target)
              : `${row.hit} of ${row.count}`;
  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          paddingBottom: 8,
          borderBottomWidth: 1,
          borderBottomColor: t.color.outlineVariant,
        }}
      >
        {cols.map((col) => (
          <Text
            key={col.key}
            variant="labelMedium"
            color="onSurfaceVariant"
            style={{ flex: col.flex, textAlign: col.align }}
          >
            {col.label}
          </Text>
        ))}
      </View>
      {towns.map((row) => (
        <View
          key={row.town}
          style={{
            flexDirection: 'row',
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: t.color.outlineVariant,
          }}
        >
          {cols.map((col) => (
            <Text
              key={col.key}
              variant={col.key === 'town' ? 'labelLarge' : 'bodyMedium'}
              style={{ flex: col.flex, textAlign: col.align }}
            >
              {cell(row, col.key)}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

// ---- Trends -----------------------------------------------------------------------------------

/** Recent alerts as grouped columns: committed and settled delivered, with each target marked. */
export function AlertHistoryBars({
  alerts,
  selected,
  onSelect,
}: {
  alerts: AlertHistoryItem[];
  selected?: string;
  onSelect: (alertId: string) => void;
}) {
  const c = useChartColors();
  const t = useTheme();
  if (alerts.length === 0) return <Empty>No alerts yet.</Empty>;
  const ordered = [...alerts].reverse();
  const max = niceMax(
    Math.max(...ordered.map((a) => Math.max(a.targetKw, a.committedKw, a.deliveredKw ?? 0))) * 1.05,
  );
  const H = 200;
  return (
    <Stack gap={3}>
      <Legend
        items={[
          { color: c.committed, label: 'Committed' },
          { color: c.delivered, label: 'Delivered (settled)' },
          { color: c.target, label: 'Target', dashed: true },
        ]}
      />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ width: 52, height: H }}>
          {ticks(max).map((v) => (
            <Text
              key={v}
              variant="labelSmall"
              color="onSurfaceVariant"
              style={{ position: 'absolute', right: 0, top: H - (v / max) * H - 8 }}
            >
              {kw(v)}
            </Text>
          ))}
        </View>
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'flex-end',
            height: H,
            gap: 12,
            borderBottomWidth: 1,
            borderBottomColor: c.grid,
          }}
        >
          {ordered.map((a) => {
            const active = a.alertId === selected;
            return (
              <Pressable
                key={a.alertId}
                onPress={() => onSelect(a.alertId)}
                accessibilityRole="button"
                accessibilityLabel={`Alert of ${dayAndClock(a.windowStart)}: committed ${kw(a.committedKw)} kW, delivered ${a.deliveredKw === null ? 'not settled' : `${kw(a.deliveredKw)} kW`}`}
                style={{
                  flex: 1,
                  maxWidth: 120,
                  height: H,
                  flexDirection: 'row',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  gap: 4,
                  paddingHorizontal: 6,
                  borderRadius: t.radius.sm,
                  backgroundColor: active ? t.color.primaryContainer : 'transparent',
                }}
              >
                <View
                  style={{
                    width: '38%',
                    height: `${(a.committedKw / max) * 100}%`,
                    backgroundColor: c.committed,
                    borderTopLeftRadius: 4,
                    borderTopRightRadius: 4,
                  }}
                />
                <View
                  style={{
                    width: '38%',
                    height: `${((a.deliveredKw ?? 0) / max) * 100}%`,
                    backgroundColor: c.delivered,
                    borderTopLeftRadius: 4,
                    borderTopRightRadius: 4,
                  }}
                />
                <View
                  style={{
                    position: 'absolute',
                    left: 4,
                    right: 4,
                    bottom: `${(a.targetKw / max) * 100}%`,
                    borderTopWidth: 2,
                    borderStyle: 'dashed',
                    borderColor: c.target,
                  }}
                />
              </Pressable>
            );
          })}
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 12, marginLeft: 60 }}>
        {ordered.map((a) => (
          <View key={a.alertId} style={{ flex: 1, maxWidth: 120, alignItems: 'center' }}>
            <Text
              variant="labelSmall"
              color={a.alertId === selected ? 'primary' : 'onSurfaceVariant'}
              align="center"
            >
              {dayAndClock(a.windowStart)}
            </Text>
            <Text variant="labelSmall" color="onSurfaceVariant" align="center">
              {a.deliveredKw === null ? 'Not settled' : percent(a.deliveredKw, a.targetKw)}
            </Text>
          </View>
        ))}
      </View>
    </Stack>
  );
}

/** Pesos paid per verified kWh for each settled alert, against the placeholder rate. */
export function CostPerKwhTrend({ alerts, rate }: { alerts: AlertHistoryItem[]; rate: number }) {
  const c = useChartColors();
  const settled = [...alerts].reverse().filter((a) => a.verifiedKwh > 0);
  if (settled.length === 0) return <Empty>No settled alerts yet.</Empty>;
  const values = settled.map((a) => a.paidPhp / a.verifiedKwh);
  const max = niceMax(Math.max(rate, ...values) * 1.1);
  const n = settled.length;
  const xAt = (i: number) => (n === 1 ? 0.5 : i / (n - 1));
  return (
    <Stack gap={3}>
      <Legend
        items={[
          { color: c.committed, label: 'Paid per verified kWh (credit + bonus)' },
          { color: c.target, label: `Placeholder rate ${php(rate)}`, dashed: true },
        ]}
      />
      <Plot
        height={170}
        yMax={max}
        yFormat={(v) => `₱${Number.isInteger(v) ? v : v.toFixed(1)}`}
        xLabels={settled.map((a, i) => ({ at: xAt(i), text: dayAndClock(a.windowStart) }))}
        label={`Cost per verified kWh over ${n} settled alerts.`}
        hover={(share) => {
          const i = Math.round(share * (n - 1));
          const a = settled[i]!;
          return {
            xShare: xAt(i),
            yPx: 166 - (values[i]! / max) * 158,
            lines: [
              dayAndClock(a.windowStart),
              `${php(values[i]!)} per kWh`,
              `${php(a.paidPhp)} for ${kw(a.verifiedKwh)} kWh`,
            ],
          };
        }}
      >
        {(y) => (
          <>
            <line
              x1={0}
              x2={W}
              y1={y(rate)}
              y2={y(rate)}
              stroke={c.target}
              strokeWidth={2}
              strokeDasharray="6 5"
              {...nonScaling}
            />
            <path
              d={values.map((v, i) => `${i === 0 ? 'M' : 'L'}${xAt(i) * W},${y(v)}`).join(' ')}
              fill="none"
              stroke={c.committed}
              strokeWidth={2.5}
              {...nonScaling}
            />
            {values.map((v, i) => (
              <ellipse
                key={settled[i]!.alertId}
                cx={xAt(i) * W}
                cy={y(v)}
                rx={5 * (W / 700)}
                ry={5}
                fill={c.committed}
              />
            ))}
          </>
        )}
      </Plot>
      <Text variant="bodySmall" color="onSurfaceVariant">
        Below the rate because photo households earn the 0.6 multiplier; the barangay bonus pushes
        it up. All reward numbers are placeholders.
      </Text>
    </Stack>
  );
}

/** Expected delivered kW as the smart-meter share grows, from the simulator's own forecast. */
export function SmartMeterWhatIf({
  households,
  params,
  targetKw,
}: {
  households: number;
  params: SimParams;
  targetKw: number;
}) {
  const c = useChartColors();
  const shares = Array.from({ length: 21 }, (_, i) => i / 20);
  const series = shares.map(
    (s) => expectedOutcome(households, { ...params, amiShare: s }).deliveredKw,
  );
  const now = expectedOutcome(households, params).deliveredKw;
  const all = series[series.length - 1]!;
  const max = niceMax(Math.max(all, targetKw) * 1.08);
  return (
    <Stack gap={3}>
      <Legend
        items={[
          { color: c.ami, label: 'Expected delivered kW' },
          { color: c.target, label: `Target ${kw(targetKw)} kW`, dashed: true },
        ]}
      />
      <Plot
        height={190}
        yMax={max}
        yFormat={(v) => kw(v)}
        xLabels={[
          { at: 0, text: '0%' },
          { at: params.amiShare, text: `Today ${fraction(params.amiShare)}` },
          { at: 1, text: '100% smart meters' },
        ]}
        label={`At ${fraction(params.amiShare)} smart meters about ${kw(Math.round(now))} kW; at 100%, about ${kw(Math.round(all))} kW.`}
        hover={(share) => {
          const i = Math.round(share * 20);
          return {
            xShare: i / 20,
            yPx: 186 - (series[i]! / max) * 178,
            lines: [
              `${fraction(i / 20)} smart meters`,
              `≈ ${kw(Math.round(series[i]!))} kW delivered`,
            ],
          };
        }}
      >
        {(y) => (
          <>
            <path
              d={`${series.map((v, i) => `${i === 0 ? 'M' : 'L'}${(i / 20) * W},${y(v)}`).join(' ')} V${y(0)} H0 Z`}
              fill={withAlpha(c.ami, 0.1)}
            />
            <path
              d={series.map((v, i) => `${i === 0 ? 'M' : 'L'}${(i / 20) * W},${y(v)}`).join(' ')}
              fill="none"
              stroke={c.ami}
              strokeWidth={2.5}
              {...nonScaling}
            />
            <line
              x1={0}
              x2={W}
              y1={y(targetKw)}
              y2={y(targetKw)}
              stroke={c.target}
              strokeWidth={2}
              strokeDasharray="6 5"
              {...nonScaling}
            />
            <line
              x1={params.amiShare * W}
              x2={params.amiShare * W}
              y1={y(max)}
              y2={y(0)}
              stroke={c.baseline}
              strokeWidth={1}
              strokeDasharray="2 4"
              {...nonScaling}
            />
            <ellipse cx={params.amiShare * W} cy={y(now)} rx={5 * (W / 700)} ry={5} fill={c.ami} />
          </>
        )}
      </Plot>
      <Text variant="bodySmall" color="onSurfaceVariant">
        {count(households)} households at {fraction(params.participation)} participation,{' '}
        {fraction(params.followThrough)} follow-through, {fraction(params.photoCompletion)} photo
        completion (simulation assumptions). Every household on a smart meter would deliver about{' '}
        {kw(Math.round(all - now))} kW more: no photos to miss.
      </Text>
    </Stack>
  );
}
