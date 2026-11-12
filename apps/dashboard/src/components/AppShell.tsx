import { useFocusVisible, useTheme, useWindowClass } from '@kapitwatt/hooks';
import { Icon, type IconName } from '@kapitwatt/icons';
import type { Theme } from '@kapitwatt/styles';
import { withAlpha } from '@kapitwatt/tokens';
import { Chip, Logo, Text } from '@kapitwatt/ui';
import { Link, usePathname } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { USE_FIXTURES } from '@/lib/client';
import { fraction } from '@/lib/format';
import { useSimParams } from '@/lib/sim-params';

type Destination = {
  href: string;
  label: string;
  /** Rail and bottom bar label. */
  short: string;
  icon: IconName;
  /** P1 screens: shown, marked as later. */
  later?: boolean;
  match?: (pathname: string) => boolean;
};

const SECTIONS: { title: string; items: Destination[] }[] = [
  {
    title: 'Operate',
    items: [
      {
        href: '/',
        label: 'Live load',
        short: 'Live',
        icon: 'chartLine',
        match: (p) => p === '/' || p.startsWith('/towns'),
      },
      { href: '/alerts/new', label: 'Send alert', short: 'Alert', icon: 'alert' },
    ],
  },
  {
    title: 'Review',
    items: [
      {
        href: '/flagged',
        label: 'Flagged readings',
        short: 'Flagged',
        icon: 'flagged',
        later: true,
      },
      { href: '/alerts/log', label: 'Alert log', short: 'Log', icon: 'history', later: true },
    ],
  },
  {
    title: 'Demo',
    items: [{ href: '/simulator', label: 'Simulator', short: 'Simulator', icon: 'simulated' }],
  },
];
const DESTINATIONS = SECTIONS.flatMap((s) => s.items);

function useActive(item: Destination): boolean {
  const pathname = usePathname();
  return item.match ? item.match(pathname) : pathname === item.href;
}

/** Web screen readers announce the current page from aria-current (RN types do not list it; RN web forwards it). */
function currentPage(active: boolean): Record<string, unknown> {
  return active ? { 'aria-current': 'page' } : {};
}

type PressState = { pressed: boolean; hovered?: boolean; focused?: boolean };

/** Hover and press wash over a content colour (M3 state layer). */
function wash(t: Theme, color: string, s: PressState) {
  const o = s.pressed ? t.stateLayer.pressed : s.hovered ? t.stateLayer.hover : 0;
  return o ? withAlpha(color, o) : 'transparent';
}

/** We draw our own rounded ring, so hide the browser's square outline on the link itself. */
const NO_NATIVE_OUTLINE = { outlineWidth: 0 } as const;

/** Focus ring only for keyboard focus (:focus-visible), never after a click. */
function focusRing(t: Theme, s: PressState, visible: boolean) {
  return s.focused && visible
    ? {
        outlineStyle: 'solid' as const,
        outlineWidth: t.borderWidth.focus,
        outlineColor: t.color.focusRing,
        outlineOffset: t.borderWidth.focusOffset,
      }
    : null;
}

/* ---------- Expanded and wider: navigation drawer ---------- */

function DrawerItem({ item }: { item: Destination }) {
  const t = useTheme();
  const ring = useFocusVisible();
  const active = useActive(item);
  const fg = active ? t.color.onSecondaryContainer : t.color.onSurfaceVariant;
  return (
    <Link href={item.href as never} asChild>
      <Pressable
        accessibilityRole="link"
        style={NO_NATIVE_OUTLINE}
        accessibilityState={{ selected: active }}
        {...currentPage(active)}
      >
        {(s: PressState) => (
          <View
            style={[
              {
                flexDirection: 'row',
                alignItems: 'center',
                gap: t.space[3],
                height: DRAWER_ITEM_HEIGHT,
                paddingHorizontal: t.space[4],
                borderRadius: t.radius.full,
                backgroundColor: active
                  ? t.color.secondaryContainer
                  : wash(t, t.color.onSurface, s),
              },
              focusRing(t, s, ring),
            ]}
          >
            <Icon name={item.icon} weight={active ? 'fill' : 'regular'} color={fg} />
            <Text variant="labelLarge" style={{ color: fg, flex: 1 }} numberOfLines={1}>
              {item.label}
            </Text>
            {item.later ? <LaterTag /> : null}
          </View>
        )}
      </Pressable>
    </Link>
  );
}

function LaterTag() {
  const t = useTheme();
  return (
    <View
      accessibilityLabel="Later priority"
      style={{
        paddingHorizontal: t.space[2],
        paddingVertical: 1,
        borderRadius: t.radius.xs,
        backgroundColor: t.color.surfaceContainerHighest,
      }}
    >
      <Text variant="labelSmall" color="onSurfaceVariant">
        P1
      </Text>
    </View>
  );
}

function DataSource({ dense = false }: { dense?: boolean }) {
  return USE_FIXTURES ? (
    <Chip label={dense ? 'Fixtures' : 'Fixture data, in browser'} tone="simulated" />
  ) : (
    <Chip
      label="Live API"
      tone="relief"
      icon={<Icon name="smartMeter" size="sm" color="onReliefContainer" />}
    />
  );
}

/**
 * One frame, one pane: the drawer (or rail) and the top app bar share the frame tone and the same
 * 64 px band, so they read as a single L around the page; the page sits in a lighter pane with a large
 * rounded corner where the two meet.
 */
const BAR_HEIGHT = 64;
const CONTENT_MAX_WIDTH = 1240;
/** Drawer rhythm: 16 from the drawer edge to a highlight, 4 between items, 24 between sections. */
const DRAWER_ITEM_HEIGHT = 52;

function Drawer() {
  const t = useTheme();
  return (
    <View
      style={{
        width: 280,
        paddingHorizontal: t.space[4],
        paddingBottom: t.space[5],
        gap: t.space[4],
      }}
    >
      <View style={{ height: BAR_HEIGHT, justifyContent: 'center', paddingHorizontal: t.space[4] }}>
        <Logo height={26} />
      </View>

      <View accessibilityRole="menu" style={{ gap: t.space[6] }}>
        {SECTIONS.map((section) => (
          <View key={section.title} style={{ gap: t.space[1] }}>
            <Text
              variant="labelMedium"
              color="onSurfaceVariant"
              style={{
                paddingHorizontal: t.space[4],
                paddingBottom: t.space[2],
                textTransform: 'uppercase',
              }}
            >
              {section.title}
            </Text>
            {section.items.map((item) => (
              <DrawerItem key={item.href} item={item} />
            ))}
          </View>
        ))}
      </View>

      <View
        style={{
          marginTop: 'auto',
          gap: t.space[2],
          padding: t.space[4],
          borderRadius: t.radius.lg,
          backgroundColor: t.color.surfaceContainerHigh,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[2] }}>
          <Icon name="location" size="sm" color="onSurfaceVariant" />
          <Text variant="titleSmall">Laguna pilot</Text>
        </View>
        <Text variant="bodySmall" color="onSurfaceVariant">
          7 towns · 21 barangays
        </Text>
        <DataSource />
      </View>
    </View>
  );
}

/* ---------- Medium: navigation rail ---------- */

/** Rail destination; `stretch` shares the width evenly (bottom bar) instead of a fixed 80. */
function RailItem({ item, stretch = false }: { item: Destination; stretch?: boolean }) {
  const t = useTheme();
  const ring = useFocusVisible();
  const active = useActive(item);
  const fg = active ? t.color.onSecondaryContainer : t.color.onSurfaceVariant;
  return (
    <Link href={item.href as never} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={item.label}
        accessibilityState={{ selected: active }}
        {...currentPage(active)}
        style={[NO_NATIVE_OUTLINE, stretch ? { flex: 1, minWidth: 0 } : null]}
      >
        {(s: PressState) => (
          <View
            style={{
              alignItems: 'center',
              gap: t.space[1],
              width: stretch ? '100%' : 80,
              paddingVertical: t.space[1],
            }}
          >
            <View
              style={[
                {
                  width: 56,
                  height: 32,
                  borderRadius: t.radius.full,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: active
                    ? t.color.secondaryContainer
                    : wash(t, t.color.onSurface, s),
                },
                focusRing(t, s, ring),
              ]}
            >
              <Icon name={item.icon} weight={active ? 'fill' : 'regular'} color={fg} />
            </View>
            <Text
              variant="labelMedium"
              numberOfLines={1}
              style={{ color: active ? t.color.onSurface : t.color.onSurfaceVariant }}
            >
              {item.short}
            </Text>
          </View>
        )}
      </Pressable>
    </Link>
  );
}

function Rail() {
  const t = useTheme();
  return (
    <View style={{ width: 80, alignItems: 'center', paddingBottom: t.space[5], gap: t.space[4] }}>
      <View style={{ height: BAR_HEIGHT, justifyContent: 'center' }}>
        <Logo variant="mark" height={30} />
      </View>
      <View accessibilityRole="menu" style={{ gap: t.space[3] }}>
        {DESTINATIONS.map((item) => (
          <RailItem key={item.href} item={item} />
        ))}
      </View>
      <RailSource />
    </View>
  );
}

/** The rail is too narrow for the data-source chip: an icon pill with a one-word label instead. */
function RailSource() {
  const t = useTheme();
  const [bg, fg, label] = USE_FIXTURES
    ? [t.color.simulatedContainer, t.color.onSimulatedContainer, 'Fixtures']
    : [t.color.reliefContainer, t.color.onReliefContainer, 'Live API'];
  return (
    <View
      accessibilityLabel={USE_FIXTURES ? 'Fixture data, in browser' : 'Live API'}
      style={{ marginTop: 'auto', alignItems: 'center', gap: t.space[1] }}
    >
      <View
        style={{
          width: 40,
          height: 32,
          borderRadius: t.radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: bg,
        }}
      >
        <Icon name={USE_FIXTURES ? 'simulated' : 'smartMeter'} size="sm" color={fg} />
      </View>
      <Text variant="labelSmall" color="onSurfaceVariant">
        {label}
      </Text>
    </View>
  );
}

/* ---------- Simulation status (FR-DASH-09: the assumptions in force stay on screen) ---------- */

/** Every parameter in force, in the shortest wording that still names it. */
function useAssumptions(): string {
  const { params } = useSimParams();
  const followThrough =
    params.photoFollowThrough === undefined || params.photoFollowThrough === params.followThrough
      ? `${fraction(params.followThrough)} follow-through`
      : `${fraction(params.followThrough)} / ${fraction(params.photoFollowThrough)} follow-through`;
  return [
    `${fraction(params.participation)} participation`,
    followThrough,
    `${fraction(params.amiShare)} smart meter`,
    `${fraction(params.photoCompletion)} photo completion`,
    `±${fraction(params.baselineNoise)} noise`,
    `${params.cutKw} kW per household`,
  ].join(' · ');
}

function SimulatedChip() {
  return (
    <Chip
      label="Simulated"
      tone="simulated"
      icon={<Icon name="simulated" size="sm" color="onSimulatedContainer" />}
    />
  );
}

function ChangeLink() {
  const t = useTheme();
  const ring = useFocusVisible();
  return (
    <Link href="/simulator" asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel="Change simulation assumptions"
        style={NO_NATIVE_OUTLINE}
      >
        {(s: PressState) => (
          <View
            style={[
              {
                flexDirection: 'row',
                alignItems: 'center',
                gap: t.space[1],
                height: t.size.controlMd,
                paddingHorizontal: t.space[3],
                borderRadius: t.radius.full,
                backgroundColor: wash(t, t.color.primary, s),
              },
              focusRing(t, s, ring),
            ]}
          >
            <Icon name="settings" size="sm" color="primary" />
            <Text variant="labelLarge" color="primary">
              Change
            </Text>
          </View>
        )}
      </Pressable>
    </Link>
  );
}

function AssumptionsText({ style }: { style?: object }) {
  return (
    <Text variant="bodySmall" color="onSurfaceVariant" style={style}>
      Households, alerts and reward rates are simulated or placeholders. {useAssumptions()}.
    </Text>
  );
}

/**
 * Top app bar for drawer and rail layouts: same frame tone and height band as the logo row, and the same
 * centred max width and gutter as the page, so its edges line up with the content at any window width.
 */
function TopAppBar({ gutter }: { gutter: number }) {
  const t = useTheme();
  return (
    <View
      style={{
        minHeight: BAR_HEIGHT,
        justifyContent: 'center',
        paddingHorizontal: gutter,
        paddingVertical: t.space[2],
      }}
    >
      <View
        style={{
          width: '100%',
          maxWidth: CONTENT_MAX_WIDTH,
          alignSelf: 'center',
          flexDirection: 'row',
          alignItems: 'center',
          gap: t.space[3],
        }}
      >
        <SimulatedChip />
        <AssumptionsText style={{ flex: 1 }} />
        <ChangeLink />
      </View>
    </View>
  );
}

/* ---------- Compact: top app bar + bottom navigation bar ---------- */

function CompactTopBar() {
  const t = useTheme();
  return (
    <View
      style={{
        height: BAR_HEIGHT,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: t.space[3],
        paddingHorizontal: t.space[4],
      }}
    >
      <Logo height={24} />
      {/* Chip pins itself to the start of its row; this wrapper centres it in the bar. */}
      <View style={{ alignSelf: 'center' }}>
        <DataSource dense />
      </View>
    </View>
  );
}

/** Inside the pane on compact: chip and Change share a row, the assumptions get the full width. */
function CompactSimulationStrip() {
  const t = useTheme();
  return (
    <View
      style={{
        gap: t.space[1],
        paddingHorizontal: t.space[4],
        paddingTop: t.space[3],
        paddingBottom: t.space[2],
        borderBottomWidth: t.borderWidth.hairline,
        borderBottomColor: t.color.outlineVariant,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <SimulatedChip />
        <ChangeLink />
      </View>
      <AssumptionsText />
    </View>
  );
}

function BottomBar() {
  const t = useTheme();
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingTop: t.space[3],
        paddingBottom: t.space[4],
      }}
    >
      {DESTINATIONS.map((item) => (
        <RailItem key={item.href} item={item} stretch />
      ))}
    </View>
  );
}

/* ---------- Shell ---------- */

/**
 * Navigation follows the M3 window size classes: drawer at expanded and wider (840+), rail at medium
 * (600 to 839), top app bar plus bottom navigation bar at compact. Pages render their own PageHeader.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const t = useTheme();
  const windowClass = useWindowClass();
  const layout = windowClass === 'compact' ? 'bar' : windowClass === 'medium' ? 'rail' : 'drawer';
  const gutter = layout === 'bar' ? t.space[4] : layout === 'rail' ? t.space[6] : t.space[8];
  const pane = (
    <View
      style={{
        flex: 1,
        overflow: 'hidden',
        backgroundColor: t.color.surface,
        borderTopLeftRadius: t.radius.xl,
        borderTopRightRadius: layout === 'bar' ? t.radius.xl : 0,
      }}
    >
      {layout === 'bar' ? <CompactSimulationStrip /> : null}
      <ScrollView contentContainerStyle={{ padding: gutter }}>
        <View
          style={{
            width: '100%',
            maxWidth: CONTENT_MAX_WIDTH,
            alignSelf: 'center',
            gap: t.space[4],
          }}
        >
          {children}
        </View>
      </ScrollView>
    </View>
  );

  if (layout === 'bar') {
    return (
      <View style={{ flex: 1, backgroundColor: t.color.surfaceContainer }}>
        <CompactTopBar />
        {pane}
        <BottomBar />
      </View>
    );
  }
  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: t.color.surfaceContainer }}>
      {layout === 'drawer' ? <Drawer /> : <Rail />}
      <View style={{ flex: 1, minWidth: 0 }}>
        <TopAppBar gutter={gutter} />
        {pane}
      </View>
    </View>
  );
}
