import { StyleSheet, View } from 'react-native';
import { kw } from '@/lib/format';
import { colors, space } from '@/theme';
import { Txt } from './ui';

/**
 * Bars drawn with plain Views: no chart library needed for magnitudes on one axis.
 * Rules followed here: thin bars, square at the baseline and rounded at the data end,
 * a 2px surface gap between stacked segments, one shared scale, and values written in
 * ink (text never wears the series colour).
 */

const BAR = 14;
const END = 4;

interface Segment {
  value: number;
  color: string;
  label: string;
}

function Bar({ segments, max }: { segments: Segment[]; max: number }) {
  const shown = segments.filter((s) => s.value > 0);
  return (
    <View style={styles.barRow}>
      {shown.map((s, i) => (
        <View
          key={s.label}
          accessibilityLabel={`${s.label}: ${kw(s.value)} kW`}
          style={{
            width: `${(s.value / max) * 100}%`,
            height: BAR,
            backgroundColor: s.color,
            marginLeft: i === 0 ? 0 : 2,
            borderTopRightRadius: i === shown.length - 1 ? END : 0,
            borderBottomRightRadius: i === shown.length - 1 ? END : 0,
          }}
        />
      ))}
    </View>
  );
}

/**
 * Committed and delivered load on one kW axis, with the target drawn as a line
 * across both, so "over or under target" reads without doing arithmetic.
 */
export function LoadBars({
  targetKw,
  committedKw,
  deliveredAmiKw,
  deliveredPhotoKw,
  deliveredKw,
}: {
  targetKw: number;
  committedKw: number;
  deliveredAmiKw: number;
  deliveredPhotoKw: number;
  deliveredKw: number;
}) {
  // Headroom past the larger of target and committed so the target label never clips.
  const max = Math.max(targetKw, committedKw, deliveredKw, 1) * 1.12;
  const targetLeft = `${(targetKw / max) * 100}%` as const;
  const split = deliveredAmiKw + deliveredPhotoKw > 0;
  const rows: { name: string; value: number; segments: Segment[] }[] = [
    {
      name: 'Committed',
      value: committedKw,
      segments: [{ value: committedKw, color: colors.series.committed, label: 'Committed' }],
    },
    {
      name: 'Delivered',
      value: deliveredKw,
      segments: split
        ? [
            { value: deliveredAmiKw, color: colors.series.deliveredAmi, label: 'Smart meter' },
            { value: deliveredPhotoKw, color: colors.series.deliveredPhoto, label: 'Meter photo' },
          ]
        : [{ value: deliveredKw, color: colors.series.deliveredPhoto, label: 'Delivered' }],
    },
  ];

  return (
    <View style={styles.loadBars}>
      <View style={styles.names}>
        {rows.map((row) => (
          <View key={row.name} style={styles.rowSlot}>
            <Txt size="sm" tone="muted">
              {row.name}
            </Txt>
          </View>
        ))}
      </View>
      <View style={styles.plot}>
        {rows.map((row) => (
          <View key={row.name} style={styles.rowSlot}>
            <Bar segments={row.segments} max={max} />
          </View>
        ))}
        <View style={[styles.targetLine, { left: targetLeft }]} />
        <View style={[styles.targetLabel, { left: targetLeft }]}>
          <Txt size="xs" tone="muted" numeric>
            Target {kw(targetKw)} kW
          </Txt>
        </View>
      </View>
      <View style={styles.values}>
        {rows.map((row) => (
          <View key={row.name} style={[styles.rowSlot, { alignItems: 'flex-end' }]}>
            <Txt size="sm" tone="ink" weight="600" numeric>
              {kw(row.value)} kW
            </Txt>
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * Progress against a target, as a share of it. The track runs to 125% so that a
 * barangay past its target visibly crosses the 100% tick instead of pinning at the end.
 */
export function TargetMeter({
  value,
  target,
  color = colors.series.deliveredPhoto,
}: {
  value: number;
  target: number;
  color?: string;
}) {
  const scale = 1.25;
  const share = target > 0 ? value / target : 0;
  const fill = Math.min(share, scale) / scale;
  return (
    <View
      style={styles.meter}
      accessibilityRole="progressbar"
      accessibilityLabel={`${Math.round(share * 100)}% of target`}
    >
      <View style={styles.meterTrack}>
        <View
          style={{
            width: `${fill * 100}%`,
            height: 8,
            backgroundColor: color,
            borderTopRightRadius: END,
            borderBottomRightRadius: END,
          }}
        />
      </View>
      <View style={[styles.meterTick, { left: `${(1 / scale) * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  loadBars: { flexDirection: 'row', gap: space.md, paddingTop: 18 },
  names: { width: 72 },
  values: { width: 76 },
  plot: { flex: 1, borderLeftWidth: 1, borderLeftColor: colors.borderStrong },
  rowSlot: { height: 26, justifyContent: 'center' },
  barRow: { flexDirection: 'row', alignItems: 'center' },
  targetLine: {
    position: 'absolute',
    top: -4,
    bottom: 0,
    width: 0,
    borderLeftWidth: 1,
    borderLeftColor: colors.ink,
    borderStyle: 'dashed',
  },
  targetLabel: { position: 'absolute', top: -20, marginLeft: -4 },
  meter: { height: 14, justifyContent: 'center', minWidth: 80 },
  meterTrack: { height: 8, backgroundColor: colors.track, borderRadius: 2, overflow: 'hidden' },
  meterTick: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 0,
    borderLeftWidth: 1.5,
    borderLeftColor: colors.ink,
  },
});
