import './leaflet.css';
import { useTheme } from '@kapitwatt/hooks';
import { PILOT_TOWN_CENTERS, REWARD, type BarangayTotals, type PilotTown } from '@kapitwatt/shared';
import { fontFamily, withAlpha } from '@kapitwatt/tokens';
import { Chip, Divider, ProgressBar, Stack, Text } from '@kapitwatt/ui';
import L from 'leaflet';
import { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { count, fraction, kw, percent } from '@/lib/format';
import { Empty, ShareScale, useShareShade } from './primitives';

/** OpenStreetMap's standard tiles (no key; light use with attribution, per the OSM tile policy),
 *  greyed out in CSS so the basemap stays behind the data. Tiles are the only network request;
 *  the bubbles still draw if they fail (for example, offline at the venue). */
const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/** Barangays sit on a ring this far from their town centre (about 0.8 km). */
const RING_DEG = 0.0075;
const MAP_HEIGHT = 440;

/**
 * Layout only. Each ring's first barangay points this way (radians, 0 = east), and the town name
 * sits on this side of the ring. Nagcarlan and Liliw are about 2 km apart, so their rings point
 * away from each other and their names go west and south.
 */
const RING_START: Partial<Record<PilotTown, number>> = { Nagcarlan: Math.PI, Liliw: 0 };
const LABEL_SIDE: Partial<Record<PilotTown, 'left' | 'below'>> = {
  Nagcarlan: 'left',
  Liliw: 'below',
};

const shareOf = (b: BarangayTotals) => (b.targetKw > 0 ? b.deliveredKw / b.targetKw : 0);
const isTown = (town: string): town is PilotTown => town in PILOT_TOWN_CENTERS;
const escape = (s: string) => s.replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);

/** A point `distance` degrees from a town centre in direction `angle` (corrected for latitude). */
function offset(c: { lat: number; lng: number }, angle: number, distance: number): L.LatLngTuple {
  return [
    c.lat + distance * Math.sin(angle),
    c.lng + (distance * Math.cos(angle)) / Math.cos((c.lat * Math.PI) / 180),
  ];
}

/** Approximate positions: each town's barangays evenly around its centre, in name order. */
function placements(barangays: BarangayTotals[]): Map<string, L.LatLngTuple> {
  const out = new Map<string, L.LatLngTuple>();
  const towns = [...new Set(barangays.map((b) => b.municipality))].filter(isTown);
  for (const town of towns) {
    const members = barangays
      .filter((b) => b.municipality === town)
      .sort((a, b) => a.name.localeCompare(b.name));
    const start = RING_START[town] ?? -Math.PI / 2;
    members.forEach((b, i) => {
      const angle = start + (i * 2 * Math.PI) / members.length;
      out.set(b.barangayId, offset(PILOT_TOWN_CENTERS[town], angle, RING_DEG));
    });
  }
  return out;
}

/**
 * The pilot on a real map: one bubble per targeted barangay, shaded by its share of target (the
 * same scale as the heat grid) and sized by committed kW, with town names beside each ring.
 * Hover for the numbers, click for the detail card. Per-barangay aggregates only.
 */
export function BarangayMap({ barangays }: { barangays: BarangayTotals[] }) {
  const t = useTheme();
  const shade = useShareShade();
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markers = useRef(new Map<string, L.CircleMarker>());
  const [selected, setSelected] = useState<string | null>(null);

  const positions = useMemo(() => placements(barangays), [barangays]);
  const maxCommitted = Math.max(1, ...barangays.map((b) => b.committedKw));
  const ranked = useMemo(() => [...barangays].sort((a, b) => shareOf(b) - shareOf(a)), [barangays]);

  // Create the map once.
  useEffect(() => {
    if (!el.current) return;
    const m = L.map(el.current, { scrollWheelZoom: false, zoomSnap: 0.25 });
    L.tileLayer(TILES, { attribution: ATTRIBUTION, maxZoom: 18 }).addTo(m);
    const centres = Object.entries(PILOT_TOWN_CENTERS) as [
      PilotTown,
      { lat: number; lng: number },
    ][];
    // Town names just outside their ring (above by default), placed geographically so they keep
    // clear of the bubbles at every zoom.
    for (const [town, c] of centres) {
      const side = LABEL_SIDE[town] ?? 'above';
      const angle = side === 'left' ? Math.PI : side === 'below' ? -Math.PI / 2 : Math.PI / 2;
      L.marker(offset(c, angle, RING_DEG * 1.9), {
        interactive: false,
        keyboard: false,
        icon: L.divIcon({
          className: 'kw-town',
          html: `<span class="kw-town-${side}">${escape(town)}</span>`,
          iconSize: [0, 0],
        }),
      }).addTo(m);
    }
    m.fitBounds(L.latLngBounds(centres.map(([, c]) => [c.lat, c.lng] as L.LatLngTuple)).pad(0.12));
    m.on('click', () => setSelected(null));
    const ro = new ResizeObserver(() => m.invalidateSize());
    ro.observe(el.current);
    map.current = m;
    return () => {
      ro.disconnect();
      m.remove();
      map.current = null;
      markers.current.clear();
    };
  }, []);

  // Sync the bubbles with the latest totals (they poll every 2 s): update in place, so an open
  // tooltip survives a refresh.
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const seen = new Set<string>();
    for (const b of barangays) {
      const pos = positions.get(b.barangayId);
      if (!pos) continue;
      seen.add(b.barangayId);
      const share = shareOf(b);
      const active = b.barangayId === selected;
      const radius = 5 + 9 * Math.sqrt(b.committedKw / maxCommitted);
      const style: L.CircleMarkerOptions = {
        radius,
        fillColor: shade(share),
        fillOpacity: 1,
        color: active
          ? t.color.onSurface
          : b.targetHit
            ? t.color.relief
            : withAlpha(t.color.relief, 0.9),
        weight: active ? 3 : b.targetHit ? 2 : 1,
      };
      const tip = [
        `<strong>${escape(b.name)}</strong>, ${escape(b.municipality)}`,
        `${percent(b.deliveredKw, b.targetKw)} of its ${kw(b.targetKw)} kW target`,
        `${kw(b.committedKw)} kW committed · ${kw(b.deliveredKw)} kW delivered`,
      ].join('<br/>');
      let marker = markers.current.get(b.barangayId);
      if (!marker) {
        const id = b.barangayId;
        marker = L.circleMarker(pos, style)
          .bindTooltip(tip, { className: 'kw-tip', direction: 'top', offset: [0, -radius] })
          .on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            setSelected(id);
          })
          .addTo(m);
        markers.current.set(id, marker);
      } else {
        // setStyle also applies the radius.
        marker.setLatLng(pos).setStyle(style).setTooltipContent(tip);
      }
      if (active) marker.bringToFront();
    }
    for (const [id, marker] of markers.current) {
      if (!seen.has(id)) {
        marker.remove();
        markers.current.delete(id);
      }
    }
  }, [barangays, positions, selected, maxCommitted, shade, t]);

  const css = `
    .kw-map .leaflet-container { font-family: ${fontFamily.regular}; background: ${t.color.surfaceContainerLow}; }
    .kw-map .leaflet-tile-pane { filter: grayscale(1) brightness(1.08) contrast(0.8); opacity: 0.7; }
    .kw-map .kw-town-above { transform: translate(-50%, -100%); }
    .kw-map .kw-town-below { transform: translate(-50%, 0); }
    .kw-map .kw-town-left { transform: translate(-100%, -50%); }
    .kw-map .leaflet-tooltip.kw-tip {
      background: ${t.color.inverseSurface}; color: ${t.color.inverseOnSurface}; border: 0;
      border-radius: ${t.radius.sm}px; box-shadow: none; padding: 6px 10px;
      font-family: ${fontFamily.medium}; font-size: 12px; line-height: 16px;
    }
    .kw-map .leaflet-tooltip.kw-tip strong { font-family: ${fontFamily.semibold}; font-weight: normal; }
    .kw-map .leaflet-tooltip-top.kw-tip::before { border-top-color: ${t.color.inverseSurface}; }
    .kw-map .kw-town span {
      position: absolute; white-space: nowrap; pointer-events: none;
      font-family: ${fontFamily.semibold}; font-size: 12px; color: ${t.color.onSurface};
      text-shadow: 0 0 3px ${t.color.surface}, 0 0 3px ${t.color.surface}, 0 0 3px ${t.color.surface};
    }
    .kw-map .leaflet-bar { border: 1px solid ${t.color.outlineVariant}; box-shadow: none; border-radius: ${t.radius.sm}px; }
    .kw-map .leaflet-bar a { color: ${t.color.onSurface}; }
    .kw-map .leaflet-control-attribution { font-size: 10px; }
  `;

  const b = barangays.find((x) => x.barangayId === selected);
  const atTarget = barangays.filter((x) => x.targetHit).length;

  return (
    <Stack gap={3}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
        <View style={{ flexGrow: 3, flexBasis: 480, minWidth: 280 }}>
          <div className="kw-map" style={{ position: 'relative' }}>
            <style>{css}</style>
            <div
              ref={el}
              role="img"
              aria-label={`Map of the Laguna pilot: ${atTarget} of ${barangays.length} targeted barangays reached their target.`}
              style={{
                height: MAP_HEIGHT,
                borderRadius: t.radius.md,
                overflow: 'hidden',
                border: `1px solid ${t.color.outlineVariant}`,
              }}
            />
          </div>
        </View>
        <View style={{ flexGrow: 1, flexBasis: 260, minWidth: 240, gap: 12 }}>
          {b ? (
            <BarangayDetail b={b} rank={ranked.indexOf(b) + 1} of={ranked.length} />
          ) : barangays.length === 0 ? (
            <Empty>No barangays targeted.</Empty>
          ) : (
            <Stack gap={3}>
              <Text variant="titleSmall">Select a barangay</Text>
              <Text variant="bodyMedium" color="onSurfaceVariant">
                Click a bubble for its numbers. {atTarget} of {barangays.length} barangays reached
                their target; each verified household there earns the bonus.
              </Text>
              <Divider />
              <Text variant="labelMedium" color="onSurfaceVariant">
                Closest to target
              </Text>
              {ranked.slice(0, 3).map((x) => (
                <SummaryRow key={x.barangayId} b={x} />
              ))}
              <Text variant="labelMedium" color="onSurfaceVariant">
                Furthest from target
              </Text>
              {ranked
                .slice(-3)
                .reverse()
                .map((x) => (
                  <SummaryRow key={x.barangayId} b={x} />
                ))}
            </Stack>
          )}
        </View>
      </View>
      <Stack direction="row" align="center" gap={5} wrap>
        <ShareScale />
        <Stack direction="row" align="center" gap={2}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              borderWidth: 1,
              borderColor: t.color.outline,
            }}
          />
          <View
            style={{
              width: 18,
              height: 18,
              borderRadius: 9,
              borderWidth: 1,
              borderColor: t.color.outline,
            }}
          />
          <Text variant="labelSmall" color="onSurfaceVariant">
            Bubble size: committed kW
          </Text>
        </Stack>
      </Stack>
      <Text variant="bodySmall" color="onSurfaceVariant">
        Town centres are approximate. We hold no surveyed barangay locations, so each town's sampled
        barangays are placed around its centre: the map shows which town, not where in it.
      </Text>
    </Stack>
  );
}

function SummaryRow({ b }: { b: BarangayTotals }) {
  return (
    <Stack direction="row" justify="space-between" gap={3}>
      <Text variant="bodyMedium" numberOfLines={1} style={{ flexShrink: 1 }}>
        {b.name}
        <Text variant="bodySmall" color="onSurfaceVariant">
          {' '}
          · {b.municipality}
        </Text>
      </Text>
      <Text variant="labelLarge">{percent(b.deliveredKw, b.targetKw)}</Text>
    </Stack>
  );
}

function BarangayDetail({ b, rank, of }: { b: BarangayTotals; rank: number; of: number }) {
  const share = shareOf(b);
  const rows: [string, string][] = [
    ['Target', `${kw(b.targetKw)} kW`],
    ['Committed', `${kw(b.committedKw)} kW (${percent(b.committedKw, b.targetKw)})`],
    ['Delivered', `${kw(b.deliveredKw)} kW`],
    ['Lost after committing', `${kw(Math.max(0, b.committedKw - b.deliveredKw))} kW`],
    ...(b.households !== undefined
      ? [['Opted-in households', count(b.households)] as [string, string]]
      : []),
    ['Rank', `${rank} of ${of}`],
  ];
  return (
    <Stack gap={3}>
      <View>
        <Text variant="titleLarge">{b.name}</Text>
        <Text variant="bodyMedium" color="onSurfaceVariant">
          {b.municipality}, Laguna
        </Text>
      </View>
      <Stack direction="row" gap={2} wrap>
        <Chip
          label={b.targetHit ? 'Target reached' : `${percent(b.deliveredKw, b.targetKw)} of target`}
          tone={b.targetHit ? 'relief' : 'neutral'}
        />
      </Stack>
      <ProgressBar
        value={Math.min(share / 1.25, 1)}
        target={1 / 1.25}
        tone={b.targetHit ? 'relief' : 'primary'}
        size="thick"
        accessibilityLabel={`${b.name} delivered ${percent(b.deliveredKw, b.targetKw)} of target`}
      />
      <Divider />
      {rows.map(([label, value]) => (
        <Stack key={label} direction="row" justify="space-between" gap={3}>
          <Text variant="bodyMedium" color="onSurfaceVariant">
            {label}
          </Text>
          <Text variant="labelLarge">{value}</Text>
        </Stack>
      ))}
      <Text variant="bodySmall" color="onSurfaceVariant">
        {b.targetHit
          ? `Every household here with a verified cut earns the ${fraction(REWARD.barangayBonusRate)} barangay bonus.`
          : 'Short of target: no barangay bonus this event.'}
      </Text>
    </Stack>
  );
}
