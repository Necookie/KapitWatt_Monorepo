import type { AlertStatus } from '@kapitwatt/shared';
import { useTheme, useWindowClass } from '@kapitwatt/hooks';
import { Icon } from '@kapitwatt/icons';
import { color as roles, withAlpha } from '@kapitwatt/tokens';
import { Text } from '@kapitwatt/ui';
import { useState } from 'react';
import { View } from 'react-native';
import { Notice } from '@/components/ui/Notice';
import { client, errorMessage, type DashboardAlert } from '@/api/client';
import { clock, kw, percent } from '@/utils/format';
import { useAction } from '@/api/queries';
import { countdownFor } from '../utils/countdown';
import { ON, ON_SOFT } from '@/styles/on-brand';
import { Countdown } from './Countdown';
import { Gauge } from './Gauge';
import { HeroButton } from './HeroButton';
import { StageTracker } from './StageTracker';

/**
 * The alert in force, on Grid Indigo: level pill (red or yellow, always with the word and icon), window,
 * the one figure that matters at this stage, the stage tracker, and the gauge with the countdown.
 */
export function LiveHero({
  alert,
  status,
  target,
  committed,
  forecast,
  delivered,
  households,
  barangays,
}: {
  alert: DashboardAlert;
  status: AlertStatus;
  target: number;
  committed: number;
  forecast: number;
  delivered: number;
  households?: number;
  barangays: number;
}) {
  const t = useTheme();
  const wide = useWindowClass() !== 'compact';
  const measured = status === 'settling' || status === 'settled';
  const settled = status === 'settled';
  const red = alert.level === 'red';
  const countdown = countdownFor(alert, status);
  const value = measured ? delivered : committed;

  // FR-DASH-12: lift the alert until its window has ended. Asked twice: it stops the event for everyone.
  const cancellable = status === 'scheduled' || status === 'active' || status === 'window_open';
  const [confirmCancel, setConfirmCancel] = useState(false);
  const cancel = useAction(() => client.cancelAlert(alert.id));

  const [pillBg, pillFg] = settled
    ? [roles.light.reliefContainer, roles.light.onReliefContainer]
    : red
      ? [roles.light.alertRed, roles.light.onAlertRed]
      : [roles.light.alertYellow, roles.light.onAlertYellow];

  return (
    <View
      style={{
        flex: 1,
        gap: t.space[5],
        padding: wide ? t.space[8] : t.space[5],
        borderRadius: t.radius.xl,
        backgroundColor: roles.light.brand,
      }}
    >
      <View style={{ flex: 1, flexDirection: wide ? 'row' : 'column', gap: t.space[6] }}>
        <View style={{ flex: 1, minWidth: 0, gap: t.space[5] }}>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: t.space[3],
            }}
          >
            <View
              accessibilityRole={settled ? undefined : 'alert'}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: t.space[1],
                paddingHorizontal: t.space[3],
                height: 30,
                borderRadius: t.radius.full,
                backgroundColor: pillBg,
              }}
            >
              <Icon name={settled ? 'verified' : 'alert'} weight="fill" size="sm" color={pillFg} />
              <Text
                variant="labelLarge"
                style={{ color: pillFg, textTransform: 'uppercase', letterSpacing: 0.6 }}
              >
                {settled
                  ? `${red ? 'Red' : 'Yellow'} alert · settled`
                  : `${red ? 'Red' : 'Yellow'} alert`}
              </Text>
            </View>
            <Text variant="titleMedium" style={{ color: ON }}>
              Peak window {clock(alert.windowStart)} to {clock(alert.windowEnd)}
            </Text>
            <Text variant="bodySmall" style={{ color: ON_SOFT }}>
              Sent {clock(alert.createdAt)} by {alert.createdBy} · {barangays} barangays
            </Text>
          </View>

          <View style={{ gap: t.space[1] }}>
            <Text variant="labelLarge" style={{ color: ON_SOFT }}>
              {measured ? 'Delivered, verified' : 'Committed so far'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: t.space[2] }}>
              <Text
                variant="dataLarge"
                style={{
                  color: ON,
                  fontSize: wide ? 72 : 56,
                  lineHeight: wide ? 76 : 60,
                  letterSpacing: -1.5,
                }}
              >
                {kw(
                  Math.round(
                    measured && status === 'settling' && delivered === 0 ? forecast : value,
                  ),
                )}
              </Text>
              <Text variant="headlineSmall" style={{ color: ON_SOFT }}>
                kW
              </Text>
            </View>
            <Text variant="bodyMedium" style={{ color: ON_SOFT }}>
              {measured && status === 'settling' && delivered === 0
                ? `Forecast, until the readings pass their checks · target ${kw(target)} kW`
                : `${percent(value, target)} of the ${kw(target)} kW target`}
              {!measured && households !== undefined
                ? ` · ${households.toLocaleString()} households`
                : ''}
              {!measured ? ` · forecast ${kw(Math.round(forecast))} kW` : ''}
            </Text>
          </View>
        </View>

        <View style={{ alignItems: 'center', justifyContent: 'center', gap: t.space[4] }}>
          <Gauge value={value} forecast={forecast} target={target} measured={measured} />
          {countdown ? <Countdown label={countdown.label} at={countdown.at} /> : null}
        </View>
      </View>

      {/* Stages across the hero's foot, clear of the gauge; cancel at the far end. */}
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: t.space[3],
          paddingTop: t.space[4],
          borderTopWidth: t.borderWidth.hairline,
          borderTopColor: withAlpha(ON, 0.16),
        }}
      >
        <StageTracker status={status} />

        {cancellable ? (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: t.space[2],
            }}
          >
            {confirmCancel ? (
              <>
                <Text variant="bodySmall" style={{ color: ON }}>
                  Lift this alert? Households are told it is over.
                </Text>
                <HeroButton
                  label="Keep alert"
                  disabled={cancel.isPending}
                  onPress={() => {
                    cancel.reset();
                    setConfirmCancel(false);
                  }}
                />
                <HeroButton
                  label="Cancel alert"
                  filled
                  busy={cancel.isPending}
                  onPress={() => cancel.mutate(undefined)}
                />
              </>
            ) : (
              <HeroButton
                label="Cancel alert"
                icon="close"
                onPress={() => setConfirmCancel(true)}
              />
            )}
          </View>
        ) : null}
      </View>
      {cancel.error ? <Notice tone="critical">{errorMessage(cancel.error)}</Notice> : null}
    </View>
  );
}
