import type {
  AlertAnalytics,
  AlertHistoryItem,
  AnalyticsOutcome,
  BarangayTotals,
  FunnelStage,
  SimParams,
} from '@kapitwatt/shared';
import { expectedOutcome } from '@kapitwatt/sim';
import type { CSSProperties } from 'react';
import { StyleSheet, View } from 'react-native';
import { count, dayAndClock, fraction, kw, percent } from '@/lib/format';
import { colors, space } from '@/theme';
import { TargetMeter } from './charts';
import { LegendItem, Txt } from './ui';

/**
 * Analytics charts for the operator, in the house style of charts.tsx: thin bars, square at the
 * baseline and rounded at the data end, one shared scale per chart, values written in ink, series
 * colours for data and status colours (always labelled) for outcomes. Plots that need a line are
 * plain SVG, like LoadCurve (the dashboard is web only).
 */

const BAR = 14;
const END = 4;
const AMI = colors.series.deliveredAmi;
const PHOTO = colors.series.deliveredPhoto;
const COMMITTED = colors.series.committed;

/** One horizontal bar made of segments on a shared scale (2px surface gap between segments). */
function Segments({
  parts,
  max,
}: {
  parts: { value: number; color: string; label: string }[];
  max: number;
}) {
  const shown = parts.filter((p) => p.value > 0);
  return (
    <View style={s.barRow}>
      {shown.map((p, i) => (
        <View
          key={p.label}
          accessibilityLabel={`${p.label}: ${count(p.value)}`}
          style={{
            width: `${(p.value / max) * 100}%`,
            height: BAR,
            backgroundColor: p.color,
            marginLeft: i === 0 ? 0 : 2,
            borderTopRightRadius: i === shown.length - 1 ? END : 0,
            borderBottomRightRadius: i === shown.length - 1 ? END : 0,
          }}
        />
      ))}
    </View>
  );
}

// ---- Verification funnel ---------------------------------------------------------------------

const STAGE_LABELS: Record<FunnelStage, { name: string; hint: string }> = {
  committed: { name: 'Committed', hint: 'households that committed' },
  evidence_started: { name: 'Evidence started', hint: 'before photo sent / meter data arriving' },
  evidence_complete: { name: 'Evidence complete', hint: 'both photos passed / enough meter data' },
  verified: { name: 'Verified', hint: 'settled with a verified cut' },
};

/**
 * Households at each verification stage, smart meter and photo stacked on one scale, with what
 * each step lost. The pitch's point in one picture: every missed photo is verified kW lost.
 */
export function VerificationFunnel({
  funnel,
  settled,
}: {
  funnel: AlertAnalytics['funnel'];
  settled: boolean;
}) {
  const total = (funnel[0]?.ami ?? 0) + (funnel[0]?.photo ?? 0);
  if (total === 0) {
    return (
      <Txt size="sm" tone="muted">
        No commitments yet.
      </Txt>
    );
  }
  return (
    <View style={{ gap: space.sm }}>
      <View style={s.legend}>
        <LegendItem color={AMI} label="Smart meter" />
        <LegendItem color={PHOTO} label="Meter photo" />
      </View>
      {funnel.map((row, i) => {
        const n = row.ami + row.photo;
        const prev = i === 0 ? n : funnel[i - 1]!.ami + funnel[i - 1]!.photo;
        const pending = row.stage === 'verified' && !settled;
        return (
          <View key={row.stage} style={s.funnelRow}>
            <View style={s.funnelName}>
              <Txt size="sm" tone="ink" weight="600">
                {STAGE_LABELS[row.stage].name}
              </Txt>
              <Txt size="xs" tone="muted">
                {STAGE_LABELS[row.stage].hint}
              </Txt>
            </View>
            <View style={s.plot}>
              {pending ? (
                <Txt size="xs" tone="muted">
                  After settlement
                </Txt>
              ) : (
                <Segments
                  max={total}
                  parts={[
                    { value: row.ami, color: AMI, label: 'Smart meter' },
                    { value: row.photo, color: PHOTO, label: 'Meter photo' },
                  ]}
                />
              )}
            </View>
            <View style={s.funnelValue}>
              {pending ? null : (
                <>
                  <Txt size="sm" tone="ink" weight="600" numeric>
                    {count(n)} · {percent(n, total)}
                  </Txt>
                  {i > 0 && prev > n ? (
                    <Txt size="xs" tone="muted" numeric>
                      {count(prev - n)} dropped
                    </Txt>
                  ) : null}
                </>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ---- Outcomes ----------------------------------------------------------------------------------

const OUTCOMES: Record<AnalyticsOutcome, { label: string; color: string }> = {
  verified: { label: 'Verified', color: colors.status.good },
  awaiting_settlement: { label: 'Awaiting settlement', color: colors.status.neutral },
  pending_review: { label: 'Held for review', color: colors.status.warning },
  missing_photo: { label: 'Missing photo', color: colors.status.critical },
  late_photo: { label: 'Late photo', color: '#D9534A' },
  failed_check: { label: 'Failed a check', color: '#7A1A12' },
  no_measured_cut: { label: 'No measured cut', color: colors.faint },
  missing_ami_data: { label: 'Missing meter data', color: '#C08A1E' },
};
const OUTCOME_ORDER = Object.keys(OUTCOMES) as AnalyticsOutcome[];

/** What became of every commitment, as one 100% bar plus a labelled breakdown. */
export function OutcomeBreakdown({ outcomes }: { outcomes: AlertAnalytics['outcomes'] }) {
  const rows = [...outcomes]
    .filter((o) => o.households > 0)
    .sort((a, b) => OUTCOME_ORDER.indexOf(a.outcome) - OUTCOME_ORDER.indexOf(b.outcome));
  const total = rows.reduce((sum, o) => sum + o.households, 0);
  if (total === 0) {
    return (
      <Txt size="sm" tone="muted">
        No commitments yet.
      </Txt>
    );
  }
  return (
    <View style={{ gap: space.md }}>
      <Segments
        max={total}
        parts={rows.map((o) => ({
          value: o.households,
          color: OUTCOMES[o.outcome].color,
          label: OUTCOMES[o.outcome].label,
        }))}
      />
      <View style={{ gap: 6 }}>
        {rows.map((o) => (
          <View key={o.outcome} style={s.outcomeRow}>
            <LegendItem color={OUTCOMES[o.outcome].color} label={OUTCOMES[o.outcome].label} />
            <Txt size="sm" tone="ink" numeric>
              {count(o.households)} · {percent(o.households, total)}
            </Txt>
          </View>
        ))}
      </View>
    </View>
  );
}

// ---- Line plots (SVG) --------------------------------------------------------------------------

const W = 1000;
const H = 180;
const PAD_TOP = 14;
const PAD_BOTTOM = 166;

const plotBox: CSSProperties = { position: 'relative', flex: 1, minWidth: 0 };
const hairline = { strokeWidth: 1, vectorEffect: 'non-scaling-stroke' as const };
/** An x-axis label. The two end labels align inward so they never run past the plot. */
const tick = (left: string): CSSProperties => ({
  position: 'absolute',
  left,
  top: H + 2,
  transform: left === '0%' ? 'none' : left === '100%' ? 'translateX(-100%)' : 'translateX(-50%)',
  whiteSpace: 'nowrap',
});

function clockSeconds(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-PH', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  });
}

/** Committed kW climbing over the commit phase, against the target. */
export function CommitTimeline({
  timeline,
  targetKw,
}: {
  timeline: AlertAnalytics['timeline'];
  targetKw: number;
}) {
  if (timeline.length === 0) {
    return (
      <Txt size="sm" tone="muted">
        No commitments yet.
      </Txt>
    );
  }
  const first = new Date(timeline[0]!.at).getTime();
  const last = new Date(timeline[timeline.length - 1]!.at).getTime();
  const span = Math.max(last - first, 1);
  const top = Math.max(targetKw, timeline[timeline.length - 1]!.committedKw, 1) * 1.12;
  const x = (iso: string) => ((new Date(iso).getTime() - first) / span) * W;
  const y = (v: number) => PAD_BOTTOM - (v / top) * (PAD_BOTTOM - PAD_TOP);
  // A step line: committed kW only changes when a commitment lands.
  const points = timeline.map((p) => `${x(p.at)},${y(p.committedKw)}`);
  const line = timeline
    .map((p, i) =>
      i === 0 ? `M${x(p.at)},${y(p.committedKw)}` : `H${x(p.at)} V${y(p.committedKw)}`,
    )
    .join(' ');
  const area = `${line} V${PAD_BOTTOM} H0 Z`;
  const end = timeline[timeline.length - 1]!;
  const crossing = timeline.find((p) => p.committedKw >= targetKw);

  return (
    <View style={{ gap: space.sm }}>
      <View style={s.legend}>
        <LegendItem
          color={COMMITTED}
          label={`Committed: ${kw(end.committedKw)} kW from ${count(end.households)} households`}
        />
        <LegendItem color={colors.ink} label={`Target (dashed): ${kw(targetKw)} kW`} />
      </View>
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <View style={{ width: 56, height: H }}>
          <Txt size="xs" tone="muted" numeric style={[s.yTick, { top: y(targetKw) - 7 }]}>
            {kw(targetKw)} kW
          </Txt>
          <Txt size="xs" tone="muted" numeric style={[s.yTick, { top: PAD_BOTTOM - 7 }]}>
            0
          </Txt>
        </View>
        <div
          style={plotBox}
          role="img"
          aria-label={`Committed load rose to ${kw(end.committedKw)} kW against a ${kw(targetKw)} kW target${crossing ? `, passing it at ${clockSeconds(crossing.at)}` : ''}.`}
        >
          <svg
            width="100%"
            height={H}
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            style={{ display: 'block' }}
          >
            <line
              x1={0}
              x2={W}
              y1={PAD_BOTTOM}
              y2={PAD_BOTTOM}
              stroke={colors.borderStrong}
              {...hairline}
            />
            <path d={area} fill={COMMITTED} fillOpacity={0.14} />
            <path
              d={line}
              fill="none"
              stroke={COMMITTED}
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1={0}
              x2={W}
              y1={y(targetKw)}
              y2={y(targetKw)}
              stroke={colors.ink}
              strokeDasharray="6 4"
              {...hairline}
            />
            {points.length === 1 ? (
              <circle cx={W / 2} cy={y(end.committedKw)} r={4} fill={COMMITTED} />
            ) : null}
          </svg>
          <Txt size="xs" tone="muted" numeric style={tick('0%') as never}>
            {clockSeconds(timeline[0]!.at)}
          </Txt>
          <Txt size="xs" tone="muted" numeric style={tick('100%') as never}>
            {clockSeconds(end.at)}
          </Txt>
        </div>
      </View>
      <View style={{ height: 14 }} />
    </View>
  );
}

/**
 * Expected delivered kW as the smart-meter share grows, from the simulator's own forecast with the
 * operator's current assumptions. Smart meters need no photos, so more of them recovers the kW the
 * photo path loses.
 */
export function SmartMeterWhatIf({
  households,
  params,
  targetKw,
}: {
  households: number;
  params: SimParams;
  targetKw: number | null;
}) {
  const shares = Array.from({ length: 21 }, (_, i) => i / 20);
  const series = shares.map((share) => ({
    share,
    kw: expectedOutcome(households, { ...params, amiShare: share }).deliveredKw,
  }));
  const now = expectedOutcome(households, params).deliveredKw;
  const all = expectedOutcome(households, { ...params, amiShare: 1 }).deliveredKw;
  const top = Math.max(all, targetKw ?? 0, 1) * 1.12;
  const x = (share: number) => share * W;
  const y = (v: number) => PAD_BOTTOM - (v / top) * (PAD_BOTTOM - PAD_TOP);
  const line = series.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.share)},${y(p.kw)}`).join(' ');

  return (
    <View style={{ gap: space.sm }}>
      <View style={s.legend}>
        <LegendItem
          color={AMI}
          label="Expected delivered kW, by share of households on smart meters"
        />
        {targetKw ? (
          <LegendItem color={colors.ink} label={`Target (dashed): ${kw(targetKw)} kW`} />
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <View style={{ width: 56, height: H }}>
          {/* Label both ends of the line only when they are far enough apart to read. */}
          {Math.abs(y(all) - y(now)) >= 16 ? (
            <Txt size="xs" tone="muted" numeric style={[s.yTick, { top: y(all) - 7 }]}>
              {kw(Math.round(all))} kW
            </Txt>
          ) : null}
          <Txt size="xs" tone="ink" numeric style={[s.yTick, { top: y(now) - 7 }]}>
            {kw(Math.round(now))} kW
          </Txt>
          <Txt size="xs" tone="muted" numeric style={[s.yTick, { top: PAD_BOTTOM - 7 }]}>
            0
          </Txt>
        </View>
        <div
          style={plotBox}
          role="img"
          aria-label={`At ${fraction(params.amiShare)} smart meters about ${kw(Math.round(now))} kW is delivered; with every household on a smart meter, about ${kw(Math.round(all))} kW.`}
        >
          <svg
            width="100%"
            height={H}
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            style={{ display: 'block' }}
          >
            <line
              x1={0}
              x2={W}
              y1={PAD_BOTTOM}
              y2={PAD_BOTTOM}
              stroke={colors.borderStrong}
              {...hairline}
            />
            {targetKw ? (
              <line
                x1={0}
                x2={W}
                y1={y(targetKw)}
                y2={y(targetKw)}
                stroke={colors.ink}
                strokeDasharray="6 4"
                {...hairline}
              />
            ) : null}
            <path
              d={line}
              fill="none"
              stroke={AMI}
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1={x(params.amiShare)}
              x2={x(params.amiShare)}
              y1={PAD_TOP}
              y2={PAD_BOTTOM}
              stroke={colors.muted}
              strokeDasharray="2 3"
              {...hairline}
            />
          </svg>
          {/* Today's point, drawn in HTML so it stays round when the SVG stretches. */}
          <div
            style={{
              position: 'absolute',
              left: `${params.amiShare * 100}%`,
              top: y(now) - 4,
              width: 8,
              height: 8,
              marginLeft: -4,
              borderRadius: 4,
              background: AMI,
            }}
          />
          <Txt size="xs" tone="muted" numeric style={tick('0%') as never}>
            0%
          </Txt>
          <Txt
            size="xs"
            tone="ink"
            weight="600"
            numeric
            style={tick(`${params.amiShare * 100}%`) as never}
          >
            Today {fraction(params.amiShare)}
          </Txt>
          <Txt size="xs" tone="muted" numeric style={tick('100%') as never}>
            100%
          </Txt>
        </div>
      </View>
      <View style={{ height: 14 }} />
      <Txt size="sm" tone="muted">
        {count(households)} households at {fraction(params.participation)} participation,{' '}
        {fraction(params.followThrough)} follow-through and {fraction(params.photoCompletion)} photo
        completion (simulation assumptions). Every household on a smart meter would deliver about{' '}
        {kw(Math.round(all - now))} kW more.
      </Txt>
    </View>
  );
}

// ---- Barangays and history ---------------------------------------------------------------------

/** Every targeted barangay ranked by its share of target, with the 100% tick on one scale. */
export function BarangayRanking({ barangays }: { barangays: BarangayTotals[] }) {
  if (barangays.length === 0) {
    return (
      <Txt size="sm" tone="muted">
        No barangays targeted.
      </Txt>
    );
  }
  const rows = [...barangays].sort(
    (a, b) =>
      b.deliveredKw / Math.max(b.targetKw, 1e-9) - a.deliveredKw / Math.max(a.targetKw, 1e-9),
  );
  return (
    <View style={{ gap: 6 }}>
      {rows.map((b) => (
        <View key={b.barangayId} style={s.rankRow}>
          <View style={s.rankName}>
            <Txt size="sm" tone="ink" weight={b.targetHit ? '600' : '400'} numberOfLines={1}>
              {b.name}
            </Txt>
            <Txt size="xs" tone="muted" numberOfLines={1}>
              {b.municipality}
            </Txt>
          </View>
          <View style={{ flex: 1 }}>
            <TargetMeter
              value={b.deliveredKw}
              target={b.targetKw}
              color={b.targetHit ? colors.status.good : PHOTO}
            />
          </View>
          <Txt size="sm" tone="ink" numeric style={s.rankValue}>
            {percent(b.deliveredKw, b.targetKw)}
          </Txt>
        </View>
      ))}
      <Txt size="xs" tone="muted">
        Delivered kW as a share of each barangay's target. The tick is 100%; green barangays reached
        it.
      </Txt>
    </View>
  );
}

/** Recent alerts: committed and settled delivered kW against each target, on one scale. */
export function AlertHistoryChart({
  alerts,
  selected,
  onSelect,
}: {
  alerts: AlertHistoryItem[];
  selected?: string;
  onSelect?: (alertId: string) => void;
}) {
  if (alerts.length === 0) {
    return (
      <Txt size="sm" tone="muted">
        No alerts yet.
      </Txt>
    );
  }
  const max =
    Math.max(...alerts.map((a) => Math.max(a.targetKw, a.committedKw, a.deliveredKw ?? 0)), 1) *
    1.08;
  return (
    <View style={{ gap: space.sm }}>
      <View style={s.legend}>
        <LegendItem color={COMMITTED} label="Committed" />
        <LegendItem color={PHOTO} label="Delivered (settled)" />
        <LegendItem color={colors.ink} label="Target (tick)" />
      </View>
      {alerts.map((a) => {
        const active = a.alertId === selected;
        return (
          <View
            key={a.alertId}
            style={[s.historyRow, active ? s.historyActive : null]}
            onStartShouldSetResponder={() => Boolean(onSelect)}
            onResponderRelease={() => onSelect?.(a.alertId)}
            accessibilityRole={onSelect ? 'button' : undefined}
            accessibilityLabel={`Alert of ${dayAndClock(a.createdAt)}`}
          >
            <View style={s.historyName}>
              <Txt size="sm" tone="ink" weight={active ? '600' : '400'} numeric>
                {dayAndClock(a.windowStart)}
              </Txt>
              <Txt size="xs" tone="muted">
                {a.level === 'red' ? 'Red' : 'Yellow'} · {a.status.replace('_', ' ')}
              </Txt>
            </View>
            <View style={[s.plot, { gap: 3 }]}>
              <Segments
                max={max}
                parts={[{ value: a.committedKw, color: COMMITTED, label: 'Committed' }]}
              />
              {a.deliveredKw !== null ? (
                <Segments
                  max={max}
                  parts={[{ value: a.deliveredKw, color: PHOTO, label: 'Delivered' }]}
                />
              ) : (
                <Txt size="xs" tone="muted">
                  Not settled
                </Txt>
              )}
              <View style={[s.targetTick, { left: `${(a.targetKw / max) * 100}%` }]} />
            </View>
            <View style={s.historyValue}>
              <Txt size="sm" tone="ink" numeric>
                {a.deliveredKw !== null ? `${kw(a.deliveredKw)} kW` : `${kw(a.committedKw)} kW`}
              </Txt>
              <Txt size="xs" tone="muted" numeric>
                {a.deliveredKw !== null
                  ? `${percent(a.deliveredKw, a.targetKw)} of target`
                  : 'committed'}
              </Txt>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  barRow: { flexDirection: 'row', alignItems: 'center' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  plot: {
    flex: 1,
    borderLeftWidth: 1,
    borderLeftColor: colors.borderStrong,
    justifyContent: 'center',
    minHeight: 30,
  },
  funnelRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  funnelName: { width: 170 },
  funnelValue: { width: 110, alignItems: 'flex-end' },
  outcomeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  yTick: { position: 'absolute', right: 0 },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  rankName: { width: 150 },
  rankValue: { width: 48, textAlign: 'right' },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  historyActive: { backgroundColor: colors.brandSoft },
  historyName: { width: 150 },
  historyValue: { width: 110, alignItems: 'flex-end' },
  targetTick: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 0,
    borderLeftWidth: 1.5,
    borderLeftColor: colors.ink,
  },
});
