import type { AlertStatus, AlertTotals } from '@kapitwatt/shared';
import { reliefForecast } from '@kapitwatt/sim';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { client, errorMessage, type DashboardAlert } from '@/lib/client';
import { clock, count, fraction, kw, percent } from '@/lib/format';
import { useAction } from '@/lib/queries';
import { useSimParams } from '@/lib/sim-params';
import { colors, space } from '@/theme';
import { LoadBars } from './charts';
import { LoadCurve } from './LoadCurve';
import { StageControl } from './StageControl';
import { Button, Card, LegendItem, Notice, Stat, Tag, Txt } from './ui';

/** The alert in force: what was sent, where it stands, and the headline load figures. */
export function AlertSummary({
  alert,
  totals,
}: {
  alert: DashboardAlert;
  totals: AlertTotals | undefined;
}) {
  const status: AlertStatus = totals?.status ?? alert.status;
  const target = totals?.targetKw ?? alert.targetKw;
  const committed = totals?.committedKw ?? 0;
  const delivered = totals?.deliveredKw ?? 0;
  const barangays = totals?.barangays ?? [];
  const hit = barangays.filter((b) => b.targetHit).length;
  const measured = status === 'settling' || status === 'settled';
  // FR-DASH-14: relief forecast = committed kW x follow-through (per path, less missed photos).
  const { params } = useSimParams();
  const forecast = reliefForecast(committed, params).deliveredKw;
  const photoFollowThrough = params.photoFollowThrough ?? params.followThrough;

  // FR-DASH-12: an alert can be lifted until its window has ended. Asked twice, since
  // it stops the event for every household at once.
  const cancellable = status === 'scheduled' || status === 'active' || status === 'window_open';
  const [confirmCancel, setConfirmCancel] = useState(false);
  const cancel = useAction(() => client.cancelAlert(alert.id));

  return (
    <>
      <Card>
        <View style={{ gap: space.md }}>
          <View style={styles.headline}>
            <Tag
              label={alert.level === 'red' ? 'Red alert' : 'Yellow alert'}
              tone={alert.level === 'red' ? 'critical' : 'warning'}
            />
            <Txt tone="ink" weight="600" numeric>
              Peak window {clock(alert.windowStart)} to {clock(alert.windowEnd)}
            </Txt>
            <Txt size="sm" tone="muted" numeric>
              Sent {clock(alert.createdAt)} by {alert.createdBy} · {barangays.length} barangays
              targeted
            </Txt>
            {cancellable ? (
              <View style={styles.cancel}>
                {confirmCancel ? (
                  <>
                    <Txt size="sm" tone="muted">
                      Lift this alert? Households are told it is over.
                    </Txt>
                    <Button
                      small
                      label="Keep alert"
                      disabled={cancel.isPending}
                      onPress={() => {
                        cancel.reset();
                        setConfirmCancel(false);
                      }}
                    />
                    <Button
                      small
                      kind="danger"
                      label="Cancel alert"
                      busy={cancel.isPending}
                      onPress={() => cancel.mutate(undefined)}
                    />
                  </>
                ) : (
                  <Button
                    small
                    kind="ghost"
                    label="Cancel alert"
                    onPress={() => setConfirmCancel(true)}
                  />
                )}
              </View>
            ) : null}
          </View>
          {cancel.error ? <Notice tone="critical">{errorMessage(cancel.error)}</Notice> : null}
          <StageControl alert={alert} status={status} />
        </View>
      </Card>

      <Card padded={false}>
        <View style={styles.stats}>
          <Stat label="Target" value={kw(target)} unit="kW" note="Relief asked for" />
          <View style={styles.divider} />
          <Stat
            label="Committed"
            value={kw(committed)}
            unit="kW"
            note={`${percent(committed, target)} of target${
              totals?.committedHouseholds !== undefined
                ? ` · ${count(totals.committedHouseholds)} households`
                : ''
            }`}
          />
          <View style={styles.divider} />
          <Stat
            label="Relief forecast"
            value={kw(Math.round(forecast))}
            unit="kW"
            note={`${percent(forecast, target)} of target, from what is committed`}
          />
          <View style={styles.divider} />
          <Stat
            label="Delivered, verified"
            value={measured ? kw(delivered) : '—'}
            unit={measured ? 'kW' : undefined}
            note={
              measured
                ? `${percent(delivered, target)} of target`
                : 'Measured after the window ends'
            }
          />
          <View style={styles.divider} />
          <Stat
            label="Barangays on target"
            value={measured ? String(hit) : '—'}
            unit={measured ? `of ${barangays.length}` : undefined}
            note={measured ? 'Bonus applies where the target is reached' : 'Decided at settlement'}
          />
        </View>
      </Card>

      <Card
        title="Committed and delivered load against target"
        aside={
          <View style={styles.legend}>
            <LegendItem color={colors.series.committed} label="Committed" />
            <LegendItem color={colors.series.deliveredAmi} label="Delivered, smart meter" />
            <LegendItem color={colors.series.deliveredPhoto} label="Delivered, meter photo" />
          </View>
        }
      >
        <LoadBars
          targetKw={target}
          committedKw={committed}
          deliveredKw={delivered}
          deliveredAmiKw={totals?.deliveredAmiKw ?? 0}
          deliveredPhotoKw={totals?.deliveredPhotoKw ?? 0}
        />
      </Card>

      <Card title="Load curve and relief forecast">
        <View style={{ gap: space.md }}>
          <LoadCurve
            windowStart={alert.windowStart}
            windowEnd={alert.windowEnd}
            baselineKw={totals?.baselineKw}
            forecastKw={forecast}
            deliveredKw={delivered}
            measured={measured}
          />
          <Txt size="xs" tone="muted">
            Load of the households that committed, averaged over the window: the pilot verifies one
            figure per household, not a 5-minute curve. The forecast is an assumption, not a
            measurement: committed kW × follow-through ({fraction(params.followThrough)} smart
            meter, {fraction(photoFollowThrough)} photo), less photo households that miss a photo (
            {fraction(1 - params.photoCompletion)}).
            {measured
              ? ` Verified relief came in ${kw(Math.abs(Math.round(delivered - forecast)))} kW ${
                  delivered >= forecast ? 'above' : 'below'
                } the forecast.`
              : ''}
          </Txt>
        </View>
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  headline: { flexDirection: 'row', alignItems: 'center', gap: space.md, flexWrap: 'wrap' },
  stats: { flexDirection: 'row', flexWrap: 'wrap' },
  divider: { width: 1, backgroundColor: colors.border, marginVertical: space.md },
  legend: { flexDirection: 'row', gap: space.md, flexWrap: 'wrap' },
  cancel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginLeft: 'auto',
    flexWrap: 'wrap',
  },
});
