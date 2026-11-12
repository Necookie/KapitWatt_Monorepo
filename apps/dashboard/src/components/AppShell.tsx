import { Link, usePathname } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { API_URL, USE_FIXTURES } from '@/lib/client';
import { fraction } from '@/lib/format';
import { useSimParams } from '@/lib/sim-params';
import { colors, space } from '@/theme';
import { Tag, Txt } from './ui';

const NAV = [
  { href: '/', label: 'Live load' },
  { href: '/alerts/new', label: 'Send alert' },
  { href: '/simulator', label: 'Simulator' },
] as const;

const LATER = [
  { href: '/flagged', label: 'Flagged readings' },
  { href: '/alerts/log', label: 'Alert log' },
] as const;

function NavLink({ href, label, later }: { href: string; label: string; later?: boolean }) {
  const pathname = usePathname();
  const active =
    href === '/' ? pathname === '/' || pathname.startsWith('/towns') : pathname === href;
  return (
    <Link href={href as never} asChild>
      <Pressable accessibilityRole="link" accessibilityState={{ selected: active }}>
        {({ hovered }: { pressed: boolean; hovered?: boolean }) => (
          <View
            style={[
              styles.navLink,
              hovered ? styles.navHover : null,
              active ? styles.navActive : null,
            ]}
          >
            <Txt
              weight={active ? '600' : '500'}
              style={{ color: active ? colors.brandStrong : later ? colors.muted : colors.body }}
            >
              {label}
            </Txt>
            {later ? <Tag label="P1" /> : null}
          </View>
        )}
      </Pressable>
    </Link>
  );
}

/** FR-DASH-09: the parameters in force stay on screen, labelled as assumptions. */
function AssumptionsBar() {
  const { params } = useSimParams();
  const items = [
    `participation ${fraction(params.participation)}`,
    params.photoFollowThrough === undefined || params.photoFollowThrough === params.followThrough
      ? `follow-through ${fraction(params.followThrough)}`
      : `follow-through ${fraction(params.followThrough)} smart meter, ${fraction(
          params.photoFollowThrough,
        )} photo`,
    `${fraction(params.amiShare)} smart meter, ${fraction(1 - params.amiShare)} photo`,
    `photo completion ${fraction(params.photoCompletion)}`,
    `baseline noise ±${fraction(params.baselineNoise)}`,
    `${params.cutKw} kW cut per household`,
  ];
  return (
    <View style={styles.assumptions}>
      <Tag label="Simulated" tone="brand" />
      <Txt size="sm" tone="muted" style={{ flexShrink: 1 }}>
        Households, the NGCP alert and reward rates are simulated or placeholders. Assumptions:{' '}
        {items.join(' · ')}.
      </Txt>
      <Link href="/simulator" asChild>
        <Pressable accessibilityRole="link">
          <Txt size="sm" weight="600" style={{ color: colors.brandStrong }}>
            Change
          </Txt>
        </Pressable>
      </Link>
    </View>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <View style={styles.root}>
      <View style={styles.sidebar}>
        <View style={styles.brand}>
          <View style={styles.brandMark} />
          <View>
            <Txt size="lg" tone="ink" weight="700">
              KapitWatt
            </Txt>
            <Txt size="xs" tone="muted">
              Utility dashboard
            </Txt>
          </View>
        </View>

        <View style={styles.navGroup}>
          {NAV.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </View>
        <View style={styles.navGroup}>
          <Txt size="xs" tone="faint" weight="600" style={styles.navHeading}>
            LATER
          </Txt>
          {LATER.map((item) => (
            <NavLink key={item.href} {...item} later />
          ))}
        </View>

        <View style={styles.sidebarFoot}>
          <Txt size="xs" tone="muted" weight="600">
            Laguna pilot
          </Txt>
          <Txt size="xs" tone="muted">
            7 towns · 21 barangays
          </Txt>
          <View style={{ height: space.sm }} />
          <Tag
            label={USE_FIXTURES ? 'Fixture data, in browser' : 'Live API'}
            tone={USE_FIXTURES ? 'warning' : 'good'}
          />
          {USE_FIXTURES ? null : (
            <Txt size="xs" tone="faint" numberOfLines={1}>
              {API_URL.replace(/^https?:\/\//, '')}
            </Txt>
          )}
        </View>
      </View>

      <View style={styles.main}>
        <AssumptionsBar />
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.page}>{children}</View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: colors.background },
  sidebar: {
    width: 208,
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingVertical: space.lg,
    gap: space.lg,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.lg },
  brandMark: { width: 22, height: 22, borderRadius: 5, backgroundColor: colors.brand },
  navGroup: { gap: 2, paddingHorizontal: space.sm },
  navHeading: { paddingHorizontal: space.sm, paddingBottom: 4, letterSpacing: 0.6 },
  navLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 32,
    paddingHorizontal: space.sm,
    borderRadius: 6,
  },
  navHover: { backgroundColor: colors.surfaceAlt },
  navActive: { backgroundColor: colors.brandSoft },
  sidebarFoot: { marginTop: 'auto', paddingHorizontal: space.lg, gap: 2 },
  main: { flex: 1, minWidth: 0 },
  assumptions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: 36,
    paddingHorizontal: space.xl,
    paddingVertical: 6,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  content: { padding: space.xl },
  page: { width: '100%', maxWidth: 1240, alignSelf: 'center', gap: space.lg },
});
