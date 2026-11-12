import type { AlertStatus } from '@kapitwatt/shared';
import { useTheme, useWindowClass } from '@kapitwatt/hooks';
import { color as roles } from '@kapitwatt/tokens';
import { Text } from '@kapitwatt/ui';
import { memo } from 'react';
import { View } from 'react-native';
import { AlertLevelPill } from '@/components/AlertLevelPill';
import { Gauge } from '@/components/Gauge';
import { Tally } from '@/components/Tally';
import type { DashboardAlert } from '@/api/client';
import { ON, ON_SOFT } from '@/styles/on-brand';
import { clock, count, kw, percent, type TownTotals } from '@/utils/format';

const round = (n: number) => kw(Math.round(n));

/**
 * The town under the alert, on Grid Indigo like the live view: level and window, the figure for this
 * stage against the town's share of the target, and the town's ring (with the forecast inside it
 * until the readings are measured).
 */
export const TownHero = memo(function TownHero({
  alert,
  status,
  town,
  measured,
  forecast,
}: {
  alert: DashboardAlert;
  status: AlertStatus;
  town: TownTotals;
  measured: boolean;
  forecast: number;
}) {
  const t = useTheme();
  const wide = useWindowClass() !== 'compact';
  const value = measured ? town.deliveredKw : town.committedKw;
  const live = status === 'scheduled' || status === 'active' || status === 'window_open';
  const n = town.barangays.length;
  const detail = measured
    ? `${town.barangaysHit} of ${n} barangays on target`
    : town.householdsKnown
      ? `${count(town.committedHouseholds)} of ${count(town.households)} households committed`
      : `forecast ${round(forecast)} kW`;
  return (
    <View
      style={{
        flex: 1,
        flexDirection: wide ? 'row' : 'column',
        alignItems: wide ? 'center' : 'flex-start',
        gap: t.space[6],
        padding: wide ? t.space[8] : t.space[5],
        borderRadius: t.radius.xl,
        backgroundColor: roles.light.brand,
      }}
    >
      <View style={{ flex: wide ? 1 : undefined, minWidth: 0, gap: t.space[4] }}>
        <View
          style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: t.space[3] }}
        >
          <AlertLevelPill level={alert.level} settled={status === 'settled'} live={live} />
          <Text variant="titleSmall" style={{ color: ON_SOFT }}>
            Peak window {clock(alert.windowStart)} to {clock(alert.windowEnd)}
          </Text>
        </View>
        <Text variant={wide ? 'headlineMedium' : 'headlineSmall'} style={{ color: ON }}>
          {town.town}
        </Text>
        <View style={{ gap: t.space[1] }}>
          <Text variant="labelLarge" style={{ color: ON_SOFT }}>
            {measured ? 'Delivered, verified' : 'Committed so far'}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: t.space[2] }}>
            <Text
              variant="dataLarge"
              style={{ color: ON, fontSize: wide ? 56 : 44, lineHeight: wide ? 60 : 48 }}
            >
              <Tally value={value} format={round} />
            </Text>
            <Text variant="titleLarge" style={{ color: ON_SOFT }}>
              kW
            </Text>
          </View>
          <Text variant="bodyMedium" style={{ color: ON_SOFT }}>
            {percent(value, town.targetKw)} of the town’s {kw(town.targetKw)} kW share · {detail}
          </Text>
        </View>
      </View>
      <Gauge
        value={value}
        forecast={forecast}
        target={town.targetKw}
        measured={measured}
        size={wide ? 168 : 144}
      />
    </View>
  );
});
