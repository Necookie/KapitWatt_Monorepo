import { memo } from 'react';
import type { SimParams } from '@kapitwatt/shared';
import { useTheme, useWindowClass } from '@kapitwatt/hooks';
import { followThroughFor } from '@kapitwatt/sim';
import { View } from 'react-native';
import { Legend } from '@/components/Legend';
import { Panel } from '@/components/Panel';
import { fraction, kw } from '@/utils/format';
import { CHART, GUTTER, type Column } from './columns';
import { WaterfallBar } from './WaterfallBar';

/**
 * Where the relief goes: Target, Committed, then what follow-through and missed photos take away,
 * ending at what is delivered (smart meter and photo). The two losses use the assumed rates; before
 * the window ends the last column is the forecast. Every missed photo is verified kW lost.
 */
export const ReliefWaterfall = memo(function ReliefWaterfall({
  target,
  committed,
  delivered,
  deliveredAmi,
  deliveredPhoto,
  measured,
  params,
  title = 'Where the relief goes',
  subtitle,
  dense = false,
}: {
  target: number;
  committed: number;
  delivered: number;
  deliveredAmi: number;
  deliveredPhoto: number;
  measured: boolean;
  params: SimParams;
  title?: string;
  /** Replaces the default subtitle (the Simulator explains its own arithmetic). */
  subtitle?: string;
  /** Narrow labels and no column notes even on wide windows (a side rail). */
  dense?: boolean;
}) {
  const t = useTheme();
  const narrowWindow = useWindowClass() === 'compact';
  const compact = dense || narrowWindow;
  const ami = t.dataViz.deliveredAmi;
  const photo = t.dataViz.deliveredPhoto;
  const loss = t.color.outlineVariant;

  const ftAmi = followThroughFor('ami', params);
  const ftPhoto = followThroughFor('standard', params);
  const amiCommitted = committed * params.amiShare;
  const photoCommitted = committed - amiCommitted;
  const afterFollowThrough = amiCommitted * ftAmi + photoCommitted * ftPhoto;
  const missedPhotos = photoCommitted * ftPhoto * (1 - params.photoCompletion);
  const forecast = afterFollowThrough - missedPhotos;
  const forecastAmi = amiCommitted * ftAmi;

  const scale = Math.max(target, committed, delivered, 1) * 1.15;
  const signed = (n: number) => (Math.round(n) === 0 ? '0' : `−${kw(Math.round(n))}`);

  const columns: Column[] = [
    {
      label: 'Target',
      from: 0,
      segs: [{ value: target, color: t.dataViz.target }],
      text: kw(target),
    },
    {
      label: 'Committed',
      from: 0,
      segs: [{ value: committed, color: t.dataViz.committed }],
      text: kw(Math.round(committed)),
    },
    {
      label: 'Follow-through',
      note: `${fraction(ftAmi)} smart, ${fraction(ftPhoto)} photo`,
      from: afterFollowThrough,
      segs: [{ value: committed - afterFollowThrough, color: loss }],
      text: signed(committed - afterFollowThrough),
      connectAt: committed,
    },
    {
      label: 'Missed photos',
      note: `${fraction(1 - params.photoCompletion)} of photo homes`,
      from: forecast,
      segs: [{ value: missedPhotos, color: loss }],
      text: signed(missedPhotos),
      connectAt: afterFollowThrough,
    },
    measured
      ? {
          label: 'Delivered',
          note: 'verified',
          from: 0,
          segs: [
            { value: deliveredAmi, color: ami },
            { value: deliveredPhoto, color: photo },
          ],
          text: kw(Math.round(delivered)),
          connectAt: forecast,
        }
      : {
          label: 'Forecast',
          note: 'assumption',
          from: 0,
          segs: [
            { value: forecastAmi, color: ami },
            { value: forecast - forecastAmi, color: photo },
          ],
          text: kw(Math.round(forecast)),
          projected: true,
          connectAt: forecast,
        },
  ];

  const targetBottom = (target / scale) * CHART;

  return (
    <Panel
      style={{ flex: 1 }}
      title={title}
      subtitle={
        subtitle ??
        (measured
          ? `Delivered is measured; the two losses use the assumed rates. Forecast was ${kw(Math.round(forecast))} kW.`
          : 'From what households committed to what Meralco can expect to verify. Losses use the assumed rates.')
      }
    >
      <View>
        <View style={{ flexDirection: 'row', marginHorizontal: -GUTTER / 2 }}>
          {columns.map((col) => (
            <WaterfallBar key={col.label} col={col} scale={scale} compact={compact} />
          ))}
        </View>
        {/* The target line runs across every column so each one reads against it. */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: CHART - targetBottom,
            height: 0,
            borderTopWidth: 2,
            borderStyle: 'dashed',
            borderColor: t.dataViz.target,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: CHART,
            height: 1,
            backgroundColor: t.color.outlineVariant,
          }}
        />
      </View>
      <Legend
        items={[
          { color: t.dataViz.target, label: 'Target' },
          { color: t.dataViz.committed, label: 'Committed' },
          { color: loss, label: 'Lost (assumed rate)' },
          { color: ami, label: compact ? 'Smart meter' : 'Delivered, smart meter' },
          { color: photo, label: compact ? 'Meter photo' : 'Delivered, meter photo' },
          ...(measured ? [] : [{ color: t.color.outline, label: 'Forecast', outline: true }]),
        ]}
      />
    </Panel>
  );
});
